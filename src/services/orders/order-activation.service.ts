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

                // L-08 FIX: Increment global usage counter
                await txPrisma.promoCode.update({
                    where: { id: data.promoId },
                    data: { currentUses: { increment: 1 } }
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
                // SANDBOX GUARD: тестовые заказы не должны засчитываться в лояльность и ачивки
                const orderMeta = order.metadata as any;
                if (!orderMeta?.isSandbox) {
                    await PromoService.checkLoyaltySpend(data.userId, data.tgId, updatedUser.spent, txPrisma);
                }
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

    /**
     * L-01 FIX: Dedicated method to activate an order that was AWAITING_PAYMENT,
     * ensuring it goes through B2B Billing and Promo logic.
     */
    static async activatePendingOrder(orderId: number, tx?: any) {
        const execute = async (txPrisma: any) => {
            const order = await txPrisma.order.findUnique({
                where: { id: orderId },
                include: { internalService: true, project: { include: { organization: true } } }
            });

            if (!order || order.status !== 'AWAITING_PAYMENT') return null;

            // --- B2B Billing (Prepaid SaaS Engine) ---
            let b2bCost = new Decimal(0);
            if (order.project?.organizationId && order.project.organization) {
                const { B2BPricingService } = await import('@/services/finance/b2b-pricing.service');
                const { OrganizationLedgerService } = await import('@/services/finance/organization-ledger.service');

                const isExempt = await B2BPricingService.isBillingExempt(order.project.organizationId);
                const unitCost = order.internalService.lastProviderPrice ? new Decimal(order.internalService.lastProviderPrice).div(1000) : new Decimal(0);
                const rawCost = unitCost.mul(order.quantity);
                
                let b2bMargin: number;
                if (order.project.organization.customB2BMarkup !== null && order.project.organization.customB2BMarkup !== undefined) {
                    b2bMargin = Number(order.project.organization.customB2BMarkup);
                } else {
                    const globalSetting = await txPrisma.globalSetting.findUnique({ where: { key: 'B2B_MARGIN_PERCENT' } });
                    b2bMargin = globalSetting ? Number(globalSetting.value) : B2BPricingService.B2B_DEFAULT_MARKUP;
                }
                
                b2bCost = B2BPricingService.calculateB2BCost(rawCost, b2bMargin);

                if (!isExempt) {
                    if (order.project.organization.masterBalance.lt(b2bCost)) {
                        console.error(`[B2B BILLING ALERT] Organization ${order.project.organization.name} (ID: ${order.project.organizationId}) has insufficient master balance. Required: ${b2bCost}, Available: ${order.project.organization.masterBalance}`);
                        throw new Error('B2B_INSUFFICIENT_FUNDS');
                    }

                    await OrganizationLedgerService.recordTransaction(txPrisma, {
                        organizationId: order.project.organizationId,
                        amount: b2bCost,
                        type: 'SERVICE_COST',
                        description: `[B2B Cost] Qty: ${order.quantity} | Service: ${order.internalService.name} | Raw: ${rawCost.toFixed(2)} | Markup: ${(b2bMargin * 100).toFixed(0)}%`
                    });
                }
            } else {
                b2bCost = order.internalService.lastProviderPrice ? new Decimal(order.internalService.lastProviderPrice).mul(order.quantity).div(1000) : new Decimal(0);
            }

            // Charge user balance 
            const { OrderFinancialService } = await import('@/services/orders/order-financial.service');
            await OrderFinancialService.chargeOrder(txPrisma, order.userId, new Decimal(order.totalPrice), order.id, order.internalService.name);

            // Apply promo logic if order has a promo
            if (order.promoCodeId) {
                await txPrisma.userPromo.upsert({
                    where: { userId_promoCodeId: { userId: order.userId, promoCodeId: order.promoCodeId } },
                    update: { usedAt: new Date() },
                    create: { userId: order.userId, promoCodeId: order.promoCodeId, usedAt: new Date() }
                });

                // L-08 FIX: Increment global usage counter
                await txPrisma.promoCode.update({
                    where: { id: order.promoCodeId },
                    data: { currentUses: { increment: 1 } }
                });
            }

            // Finally, transition state
            const updatedOrder = await txPrisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'PENDING',
                    costPrice: b2bCost,
                }
            });

            return updatedOrder;
        };

        return tx ? execute(tx) : await prisma.$transaction(execute);
    }
}


