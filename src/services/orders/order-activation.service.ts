/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { BotRegistry, bot } from '@/lib/bot';
import { Prisma } from '@/generated/client';
import { Decimal } from 'decimal.js';
import { formatAmount } from '@/utils/formatter';
import { ConfigService } from '@/lib/config.service';
import { ManagedChannelService } from '@/services/vip/managed-channel.service';
import { NotificationTemplates } from '@/bot/utils/notification-templates';
import { PromoService } from '@/services/users/promo.service';
import { OrderLifecycleService } from './order-lifecycle.service';
import { OrderFinancialService } from './order-financial.service';
import { OrderInitiateData } from '@/types/orders';
import { MarketerSettings } from '@/types/project-settings';

export class OrderActivationService {
    /**
     * Создает заказ в базе данных, списывает баланс и уведомляет админов.
     */
    static async initiateOrder(data: OrderInitiateData, tx?: Prisma.TransactionClient) {
        const execute = async (txPrisma: Prisma.TransactionClient) => {
            let isSmartFrag = false;

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
                const project = await txPrisma.project.findUnique({ where: { id: data.projectId } });
                isSmartFrag = (project?.marketerSettings as MarketerSettings | null)?.isSmartFragmentationEnabled === true;
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
                    await BotRegistry.get(data.projectId).telegram.sendMessage(data.tgId, NotificationTemplates.ORDER.CREATED_USER(order.id, order.internalService.name), { parse_mode: 'HTML' });
                } catch (err) {
                    console.error('Failed to send order start notification:', err);
                }
                await PromoService.checkLoyaltySpend(data.userId, data.tgId, updatedUser.spent.toNumber(), txPrisma);
            }

            const telegramConfig = await ConfigService.getTelegramConfig(data.projectId || undefined);
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
