/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { OrderStatus, Order } from '@/generated/client';
import { ProviderService } from '@/services/providers';
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

        // Импортируем OrderProcessorService динамически
        const OrderProcessorService = await import('@/services/orders/order-processor.service');

        for (const [providerName, orders] of Object.entries(groupedByProvider)) {
            try {
                const provider = await prisma.provider.findFirst({ where: { name: providerName, isEnabled: true } });
                if (!provider) {
                    this.logger.warn(`[OrderSync] Provider ${providerName} not found or disabled. Skipping ${orders.length} orders.`);
                    continue;
                }

                const externalIds = orders.map(o => o.externalId!).filter(Boolean);
                if (externalIds.length === 0) continue;

                this.logger.info(`[OrderSync] Bulk syncing ${externalIds.length} orders from ${providerName}...`);
                const statuses = await ProviderService.getStatuses(provider.id, externalIds);

                for (const order of orders) {
                    const data = statuses[order.externalId!];
                    if (data) {
                        try {
                            await this.processSyncResult(order, data, OrderProcessorService);
                        } catch (err) {
                            this.logger.error(`[OrderSync] Failed to process order ${order.id}:`, err);
                        }
                    } else {
                        // Fallback if bulk didn't return this specific ID for some reason
                        try {
                            await this.syncSingleOrder(order, OrderProcessorService);
                        } catch (err) {
                            this.logger.error(`[OrderSync] Fallback sync failed for order ${order.id}:`, err);
                        }
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
    static async syncSingleOrder(o: any, processor: any) {
        const data = await ProviderService.getOrderStatus(o as Order);
        await this.processSyncResult(o, data, processor);
    }

    /**
     * Обработка результата синхронизации заказа.
     */
    private static async processSyncResult(o: any, data: any, processor: any) {
        if (data.error) {
            this.logger.warn(`[OrderSync] Failed to sync order ${o.id}: ${data.error}`);
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
                // Пытаемся автоматически перезапустить у другого провайдера
                this.logger.info(`[OrderSync] Order ${o.id} canceled by provider. Attempting auto-refill...`);
                const refilled = await processor.tryAutoRefill(o.id);

                if (refilled) {
                    this.logger.info(`[OrderSync] Order ${o.id} successfully refilled via alternative provider.`);
                    return; // Не делаем возврат, так как заказ перезапущен
                }

                // Если перезапуск не удался - делаем стандартный возврат
                await processor.handleRefund(o, newS, rem);
            } else if (newS === 'PARTIAL' && rem > 0) {
                await processor.handleRefund(o, newS, rem);
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
        const updateData: any = {
            status,
            remains,
            providerRawResponse: rawData
        };

        if (rawData.cost && rawData.cost > 0) {
            updateData.costPrice = new Decimal(rawData.cost);
        }

        await prisma.order.update({
            where: { id },
            data: updateData
        });
    }
}
