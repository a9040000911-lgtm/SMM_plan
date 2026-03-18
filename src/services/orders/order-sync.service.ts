/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { OrderStatus, Order } from '@/generated/client';
import { ProviderService } from '../providers/provider.service';
import { Decimal } from 'decimal.js';
import { createLogger } from '@/lib/logger';

/**
 * Сервис для синхронизации статусов заказов между провайдерами и нашей БД.
 */
export class OrderSyncService {
    private static logger = createLogger('OrderSyncService');

    /**
     * Массовая синхронизация статусов активных заказов.
     */
    static async syncAllActive(orderIds?: number[]) {
        const activeOrders = await prisma.order.findMany({
            take: 100,
            where: {
                status: { in: ['PENDING', 'PROCESSING', 'IN_PROGRESS'] },
                externalId: { not: null },
                ...(orderIds ? { id: { in: orderIds } } : {})
            },
            include: { user: true, internalService: true }
        });

        if (activeOrders.length === 0) return;

        this.logger.info(`[OrderSync] Syncing ${activeOrders.length} orders...`);

        // Группируем заказы по провайдерам для bulk-запросов
        const groupedByProvider: Record<string, typeof activeOrders> = {};
        for (const order of activeOrders) {
            if (!order.providerName) continue;
            if (!groupedByProvider[order.providerName]) groupedByProvider[order.providerName] = [];
            groupedByProvider[order.providerName].push(order);
        }

        // Динамические импорты для борьбы с циклами
        const { OrderRefundService } = await import('@/services/orders/order-refund.service');

        for (const [providerName, orders] of Object.entries(groupedByProvider)) {
            try {
                const provider = await prisma.provider.findFirst({ where: { name: providerName, isEnabled: true } });
                if (!provider) continue;

                const externalIds = orders.map(o => o.externalId!).filter(Boolean);
                if (externalIds.length === 0) continue;

                const statuses = await ProviderService.getStatuses(provider.id, externalIds);

                for (const order of orders) {
                    const data = statuses[order.externalId!];
                    if (data) {
                        await this.processSyncResult(order, data, { OrderRefundService });
                    } else {
                        await this.syncSingleOrder(order, { OrderRefundService });
                    }
                }
            } catch (err) {
                this.logger.error(`[OrderSync] Bulk sync failed for provider ${providerName}:`, err);
            }
        }
    }

    /**
     * Синхронизация статуса одного заказа (fallback).
     */
    static async syncSingleOrder(o: any, services?: { OrderRefundService: any }) {
        try {
            const data = await ProviderService.getOrderStatus(o as Order);
            const refundService = services?.OrderRefundService || (await import('@/services/orders/order-refund.service')).OrderRefundService;
            await this.processSyncResult(o, data, { OrderRefundService: refundService });
        } catch (err) {
            this.logger.error(`[OrderSync] Single sync failed for order ${o.id}:`, err);
        }
    }


    /**
     * Обработка результата синхронизации заказа.
     */
    private static async processSyncResult(o: any, data: any, services: { OrderRefundService: any }) {
        if (data.error) {
            await prisma.order.update({
                where: { id: o.id },
                data: { providerRawResponse: { error: data.error } }
            });
            return;
        }

        const extStatus = data.status.toLowerCase();
        const newS = this.mapStatus(extStatus);

        if (newS && (newS !== o.status || (data.remains !== undefined && data.remains !== o.remains))) {
            const rem = data.remains !== undefined ? data.remains : 0;

            if (newS === 'CANCELED') {
                this.logger.info(`[OrderSync] Order ${o.id} canceled. Trying auto-refill...`);
                const refilled = await this.tryAutoRefill(o.id);
                if (refilled) return;

                await services.OrderRefundService.handleRefund(o, newS, rem);
            } else if (newS === 'PARTIAL' && rem > 0) {
                await services.OrderRefundService.handleRefund(o, newS, rem);
            } else {
                await this.updateOrder(o.id, newS, rem, data);
            }
        }
    }

    private static mapStatus(ext: string): OrderStatus | null {
        const extStatus = ext.toLowerCase();
        if (['completed', 'finished', 'complete'].includes(extStatus)) return 'COMPLETED';
        if (['in progress', 'running', 'inprogress'].includes(extStatus.replace(/\s+/g, ''))) return 'IN_PROGRESS';
        if (['processing', 'pending', 'queued'].includes(extStatus)) return 'PROCESSING';
        if (['partial', 'partially_completed'].includes(extStatus)) return 'PARTIAL';
        if (['canceled', 'cancelled', 'error'].includes(extStatus)) return 'CANCELED';
        return null;
    }

    private static async updateOrder(id: number, status: OrderStatus, remains: number, rawData: any) {
        const updateData: any = { status, remains, providerRawResponse: rawData };
        if (rawData.cost && rawData.cost > 0) updateData.costPrice = new Decimal(rawData.cost);
        await prisma.order.update({ where: { id }, data: updateData });
    }

    /**
     * Пытается автоматически перезаложить заказ у другого провайдера.
     * MOVED FROM OrderQueueService to break circular dependencies.
     */
    static async tryAutoRefill(orderId: number): Promise<boolean> {
        // We reuse ProviderService and other logic here.
        // Importing what we need...
        const { ConfigService } = await import('@/services/core/config.service');
        const { NotificationTemplates } = await import('@/bot/utils/notification-templates');

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                project: true,
                internalService: {
                    include: {
                        providerMappings: {
                            where: { isActive: true },
                            orderBy: { priority: 'asc' },
                            include: { provider: true }
                        }
                    }
                }
            }
        }) as any;

        if (!order) return false;

        const settings = order.project?.marketerSettings as any | null;
        const isVip = settings?.isVipFailoverEnabled === true;

        const nextMappings = await prisma.internalServiceMapping.findMany({
            where: {
                internalServiceId: order.internalServiceId,
                OR: [
                    { projectId: order.projectId },
                    { projectId: null }
                ],
                isActive: true,
                provider: { name: { not: order.providerName || '' } }
            },
            orderBy: [
                { projectId: 'desc' },
                { priority: 'asc' }
            ],
            include: { provider: true }
        });

        if (nextMappings.length === 0) {
            this.logger.info(`[Auto-Refill] No alternative providers for order ${order.id}`);
            return false;
        }

        for (const mapping of nextMappings) {
            const providerSvc = await prisma.providerService.findUnique({
                where: { id: mapping.providerServiceId }
            });

            if (!providerSvc) continue;

            const costPer1000 = providerSvc.rawPrice;
            const userPaidPer1000 = order.totalPrice.mul(1000).div(order.quantity);

            if (costPer1000.gte(userPaidPer1000)) {
                if (!isVip) {
                    this.logger.info(`[Auto-Refill] Alternative provider ${mapping.provider.name} is too expensive (${costPer1000} > ${userPaidPer1000})`);
                    continue;
                }
                this.logger.info(`[Auto-Refill] VIP Guardian: Choosing expensive provider ${mapping.provider.name} (${costPer1000} > ${userPaidPer1000}) to ensure results.`);
            }

            this.logger.info(`[Auto-Refill] Attempting restart for order ${order.id} via ${mapping.provider.name}`);

            try {
                const res = await ProviderService.createOrder(order, order.quantity, { providerId: mapping.providerId, providerServiceId: mapping.providerServiceId.toString() });

                if (res.success) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            externalId: res.externalId,
                            providerName: res.providerName,
                            status: 'PROCESSING',
                            providerRawResponse: res.rawData || { info: 'Auto-Refill successful' }
                        }
                    });

                    const telegramConfig = await ConfigService.getTelegramConfig(order.projectId || undefined);
                    const adminId = telegramConfig.adminId;
                    const { bot } = await import('@/services/bot/bot-registry');

                    if (adminId) {
                        const loss = costPer1000.minus(userPaidPer1000).mul(order.quantity).div(1000);
                        const lossMsg = loss.gt(0) ? `\n⚠️ <b>Расход на лояльность:</b> <code>-${loss.toFixed(2)}₽</code> (принято решение в пользу клиента)` : '';

                        await bot.telegram.sendMessage(adminId,
                            NotificationTemplates.ORDER.REFILL_SUCCESS_ADMIN(order.id, order.providerName || '', res.providerName || '', lossMsg),
                            { parse_mode: 'HTML' }
                        ).catch(() => { });
                    }

                    return true;
                }
            } catch (e) {
                this.logger.error(`[Auto-Refill] Failed to restart via ${mapping.provider.name}:`, e);
            }
        }

        return false;
    }
}


