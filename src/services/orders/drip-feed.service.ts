/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers';
import { dripFeedQueue } from '@/services/core/queues';
import { Order } from '@prisma/client';
import { createLogger } from '@/lib/logger';

export class DripFeedService {
    private static logger = createLogger('DripFeedService');

    /**
     * Выполняет один запуск капельной подачи
     */
    static async processRun(orderId: number) {
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
        });

        if (!order || !order.isDripFeed || order.currentRun >= order.runs) return;

        // 1. Иерархическая проверка: отключен ли дрип-фид?
        const isProjectDisabled = order.project?.isDripFeedDisabled;
        const isServiceDisabled = order.internalService.isDripFeedDisabled;

        if (isProjectDisabled || isServiceDisabled) {
            this.logger.info(`[Smart Queue] Drip-feed disabled for project/service. Order: ${orderId}`);
            // Можно либо отменить оставшиеся раны, либо запустить все сразу. 
            // Для безопасности просто логируем и выходим, или запускаем проверку позже.
            return;
        }

        // 2. Overlap Prevention: проверка предыдущего заказа
        if (order.externalId) {
            try {
                const status = await ProviderService.getOrderStatus(order);
                const activeStatuses = ['PENDING', 'PROCESSING', 'IN_PROGRESS'];

                if (activeStatuses.includes(status.status)) {
                    this.logger.info(`[Smart Queue] Previous run (${order.externalId}) still active. Delaying run ${order.currentRun + 1} for 30m.`);

                    // Переносим запуск
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { nextRunAt: new Date(Date.now() + 30 * 60000) }
                    });

                    await dripFeedQueue.add(`retry-${order.id}-${order.currentRun + 1}`,
                        { orderId: order.id },
                        { delay: 30 * 60000 }
                    );
                    return;
                }
            } catch (err) {
                this.logger.error(`[Smart Queue] Failed to check status for ${order.externalId}:`, err);
                // Если провайдер упал, пробуем позже
                await dripFeedQueue.add(`retry-err-${order.id}-${order.currentRun + 1}`,
                    { orderId: order.id },
                    { delay: 15 * 60000 }
                );
                return;
            }
        }

        const mappings = order.internalService.providerMappings;
        // L-03 FIX: Last run gets remainder to prevent unit loss
        // e.g. qty=1000, runs=3: runs 1-2 get 333, run 3 gets 334 (total=1000)
        const baseQty = Math.floor(order.quantity / order.runs);
        const isLastRun = (order.currentRun + 1) >= order.runs;
        const qtyToOrder = isLastRun
            ? order.quantity - baseQty * (order.runs - 1)
            : baseQty;
        const userPaidPer1000 = order.totalPrice.mul(1000).div(order.quantity);

        // Пробуем запустить через Smart Switching
        let success = false;
        for (const m of mappings) {
            // 3. Проверка: не отключен ли дрип-фид у конкретного провайдера?
            if (m.provider.isDripFeedDisabled) {
                this.logger.info(`[Smart Queue] Provider ${m.provider.name} has drip-feed disabled. Skipping.`);
                continue;
            }

            // 4. Margin Protection Gate: не уйти в убыток при смене провайдера
            const providerSvc = await prisma.providerService.findFirst({
                where: { providerId: m.providerId, provider: { name: m.provider.name }, isActive: true },
                orderBy: { rawPrice: 'asc' }
            });
            if (providerSvc) {
                const { Decimal } = await import('decimal.js');
                const rawPrice = new Decimal(providerSvc.rawPrice as any);
                if (rawPrice.gte(userPaidPer1000)) {
                    this.logger.warn(`[DripFeed Margin Guard] Skipping ${m.provider.name}: provider price (${rawPrice}) >= user price (${userPaidPer1000}). Protecting margin.`);
                    continue;
                }
            }

            const res = await ProviderService.createOrder(order, qtyToOrder, { providerId: m.providerId, providerServiceId: m.providerServiceId.toString() });
            if (res.success) {
                success = true;
                const nextRun = order.currentRun + 1;
                const isFinished = nextRun >= order.runs;

                // Фиксируем актуальный costPrice для этого рана (для корректных Refund/B2B)
                const runCostPrice = providerSvc
                    ? new (await import('decimal.js')).Decimal(providerSvc.rawPrice as any).div(1000).mul(qtyToOrder)
                    : undefined;

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        externalId: res.externalId,
                        providerName: res.providerName, // Фиксируем текущего провайдера
                        status: 'PROCESSING',
                        currentRun: nextRun,
                        nextRunAt: isFinished ? null : new Date(Date.now() + order.interval * 60000),
                        providerRawResponse: res.rawData || { info: `Run ${nextRun} successful` },
                        ...(runCostPrice ? { costPrice: runCostPrice } : {})
                    }
                });

                if (!isFinished) {
                    await dripFeedQueue.add(`run-${order.id}-${nextRun + 1}`,
                        { orderId: order.id },
                        { delay: order.interval * 60000, jobId: `run-${order.id}-${nextRun + 1}` }
                    );
                }
                break;
            } else if (res.error?.toLowerCase().includes('already in progress') || res.error?.toLowerCase().includes('order exists')) {
                // Если провайдер вернул ошибку наложения — ждем
                this.logger.warn(`[Smart Queue] Provider ${m.provider.name} rejected due to overlap. Rescheduling.`);
                await prisma.order.update({
                    where: { id: order.id },
                    data: { nextRunAt: new Date(Date.now() + 60 * 60000) } // Ждем час
                });
                await dripFeedQueue.add(`delay-overlap-${order.id}`, { orderId: order.id }, { delay: 60 * 60000, jobId: `delay-overlap-${order.id}-${Date.now()}` });
                return;
            }
        }

        if (!success) {
            this.logger.error(`[Drip-feed] Run ${order.currentRun + 1} failed for order ${orderId} - all providers failed. Refunding remaining runs.`);
            // Если все провайдеры отвалились, нужно вернуть средства за невыполненные раны, чтобы заказ не завис в пустоте.
            const remainingRuns = order.runs - order.currentRun;
            const remainingQty = remainingRuns * qtyToOrder;
            const { OrderRefundService } = await import('@/services/orders/order-refund.service');
            await OrderRefundService.handleRefund(order as any, 'PARTIAL', remainingQty, { error: 'All providers failed during Drip-Feed run' });
        }
    }

    /**
     * Планирует первый запуск для нового Drip-feed заказа
     */
    static async scheduleFirstRun(order: Order, externalId: string, providerName: string, rawData: any) {
        const nextRun = 1;
        const isFinished = nextRun >= order.runs;

        await prisma.order.update({
            where: { id: order.id },
            data: {
                externalId,
                providerName,
                status: 'PROCESSING',
                currentRun: nextRun,
                nextRunAt: isFinished ? null : new Date(Date.now() + order.interval * 60000),
                providerRawResponse: rawData
            }
        });

        if (!isFinished) {
            await dripFeedQueue.add(`run-${order.id}-2`,
                { orderId: order.id },
                { delay: order.interval * 60000 }
            );
        }
    }
}


