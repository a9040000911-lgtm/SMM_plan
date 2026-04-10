/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { BotRegistry, bot } from '@/services/bot/bot-registry';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { formatAmount } from '@/utils/formatter';
import { ConfigService } from '@/services/core/config.service';
import { ManagedChannelService } from '@/services/vip/managed-channel.service';
import { NotificationTemplates } from '@/bot/utils/notification-templates';
import { PromoService } from '@/services/users/promo.service';
import { OrderLifecycleService } from './order-lifecycle.service';
import { OrderFinancialService } from './order-financial.service';
import { OrderInitiateData } from '@/types/orders';
import { MarketerSettings } from '@/types/project-settings';
import { B2BPricingService } from '@/services/finance/b2b-pricing.service';
import { OrganizationLedgerService } from '@/services/finance/organization-ledger.service';

export class OrderActivationService {
    /**
     * Создает заказ в базе данных, списывает баланс и уведомляет админов.
     */
    static async initiateOrder(data: OrderInitiateData, tx?: Prisma.TransactionClient) {
        const execute = async (txPrisma: Prisma.TransactionClient) => {
            let isSmartFrag = false;

            // 0. Strict Mathematical Validation (Anti-Exploit Guard)
            if (!Number.isInteger(data.qty) || data.qty <= 0) {
                console.error(`[OrderActivation Exploit Attempt] Invalid Quantity detected: ${data.qty} for user ${data.userId}`);
                throw new Error('QUANTITY_MUST_BE_POSITIVE_INTEGER');
            }
            if (new Decimal(data.totalPrice).lt(0)) {
                console.error(`[OrderActivation Exploit Attempt] Negative Price detected: ${data.totalPrice} for user ${data.userId}`);
                throw new Error('PRICE_CANNOT_BE_NEGATIVE');
            }

            // 1. Fetch service details to verify price integrity (Last Defense)
            const service = await txPrisma.internalService.findUnique({
                where: { id: data.serviceId },
                select: { lastProviderPrice: true, isActive: true, name: true }
            });

            if (!service || !service.lastProviderPrice || new Decimal(service.lastProviderPrice).isZero() || !service.isActive) {
                // If service is zero price but somehow was active, disable it now
                if (service?.isActive) {
                    await txPrisma.internalService.update({
                        where: { id: data.serviceId },
                        data: { isActive: false }
                    });
                }
                throw new Error('SERVICE_UNAVAILABLE');
            }

            if (data.projectId) {
                const project = await txPrisma.project.findUnique({ 
                    where: { id: data.projectId },
                    include: { organization: true } 
                });
                
                isSmartFrag = (project?.marketerSettings as MarketerSettings | null)?.isSmartFragmentationEnabled === true;

                // --- B2B Billing (Prepaid SaaS Engine) ---
                if (project?.organizationId && project.organization) {
                    const isExempt = await B2BPricingService.isBillingExempt(project.organizationId);
                    
                    const unitCost = new Decimal(service.lastProviderPrice).div(1000);
                    const rawCost = unitCost.mul(data.qty);
                    
                    const customB2BMarkup = project.organization.customB2BMarkup;
                    let b2bMargin: number;

                    if (customB2BMarkup !== null && customB2BMarkup !== undefined) {
                        b2bMargin = Number(customB2BMarkup);
                    } else {
                        const globalSetting = await txPrisma.globalSetting.findUnique({ where: { key: 'B2B_MARGIN_PERCENT' } });
                        b2bMargin = globalSetting ? Number(globalSetting.value) : B2BPricingService.B2B_DEFAULT_MARKUP;
                    }
                    
                    const b2bCost = B2BPricingService.calculateB2BCost(rawCost, b2bMargin);
                    
                    // Save B2B cost into the order record so we know exactly how much to refund if it fails
                    data.costPrice = b2bCost;

                    if (!isExempt) {
                        if (project.organization.masterBalance.lt(b2bCost)) {
                            console.error(`[B2B BILLING ALERT] Organization ${project.organization.name} (ID: ${project.organizationId}) has insufficient master balance. Required: ${b2bCost}, Available: ${project.organization.masterBalance}`);
                            throw new Error('B2B_INSUFFICIENT_FUNDS');
                        }

                        // Deduct B2B Cost immediately before accepting the order
                        await OrganizationLedgerService.recordTransaction(txPrisma, {
                            organizationId: project.organizationId,
                            amount: b2bCost,
                            type: 'SERVICE_COST',
                            description: `[B2B Cost] Qty: ${data.qty} | Service: ${service.name} | Raw: ${rawCost.toFixed(2)} | Markup: ${(b2bMargin * 100).toFixed(0)}%`
                        });
                    } else {
                        // Even if exempt, we save the rawCost as costPrice for margin analytics
                        data.costPrice = rawCost;
                    }
                }
            }

            const order = await OrderLifecycleService.createOrderRecord(txPrisma, {
                ...data,
                promoCodeId: data.promoId,
                isDripFeed: !!data.isDripFeed || (data.qty >= 1000 && isSmartFrag),
                runs: data.dripFeed?.runs || (data.qty >= 1000 && isSmartFrag ? 10 : 1),
                interval: data.dripFeed?.interval || (data.qty >= 1000 && isSmartFrag ? 240 : 0),
                isManual: !!data.isManual
            });

            await OrderFinancialService.chargeOrder(txPrisma, data.userId, data.totalPrice, order.id, order.internalService.name);

            if (data.promoId) {
                await txPrisma.userPromo.upsert({
                    where: { userId_promoCodeId: { userId: data.userId, promoCodeId: data.promoId } },
                    update: { usedAt: new Date() },
                    create: { userId: data.userId, promoCodeId: data.promoId, usedAt: new Date() }
                });
            }

            await txPrisma.transaction.create({
                data: {
                    projectId: data.projectId,
                    userId: data.userId,
                    orderId: order.id,
                    amount: data.totalPrice,
                    type: 'NEW_ORDER',
                    provider: 'INTERNAL',
                    status: 'COMPLETED'
                }
            });

            const updatedUser = await txPrisma.user.findUnique({ where: { id: data.userId } });
            if (!updatedUser) throw new Error('User not found after charge');

            if (data.tgId) {
                try {
                    await BotRegistry.get(data.projectId).telegram.sendMessage(data.tgId.toString(), NotificationTemplates.ORDER.CREATED_USER(order.id, order.internalService.name), { parse_mode: 'HTML' });
                } catch (err) {
                    console.error('Failed to send order start notification:', err);
                }
                await PromoService.checkLoyaltySpend(data.userId, data.tgId, updatedUser.spent, txPrisma);
            }

            const telegramConfig = await ConfigService.getTelegramConfig(data.projectId || undefined, txPrisma);
            if (telegramConfig.adminId) {
                await bot.telegram.sendMessage(telegramConfig.adminId,
                    NotificationTemplates.ORDER.CREATED_ADMIN(
                        'Smmplan',
                        data.username || data.tgId?.toString() || 'unknown',
                        order.internalService.name,
                        formatAmount(data.totalPrice),
                        data.link,
                        data.qty
                    ),
                    { parse_mode: 'HTML' }
                ).catch(e => console.error('Failed to notify admin:', e));
            }

            await ManagedChannelService.linkOrderToChannel(order.id, data.link, data.projectId, txPrisma).catch(err => {
                console.error(`[ManagedChannel] Failed to link order ${order.id}:`, err);
            });

            return order;
        };

        return tx ? execute(tx) : await prisma.$transaction(execute);
    }
}


