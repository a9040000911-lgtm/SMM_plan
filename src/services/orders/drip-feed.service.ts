/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers';
import { dripFeedQueue } from '@/services/core/queues';
import { Order } from '@/generated/client';
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
        const qtyToOrder = Math.floor(order.quantity / order.runs);

        // Пробуем запустить через Smart Switching
        let success = false;
        for (const m of mappings) {
            // 3. Проверка: не отключен ли дрип-фид у конкретного провайдера?
            if (m.provider.isDripFeedDisabled) {
                this.logger.info(`[Smart Queue] Provider ${m.provider.name} has drip-feed disabled. Skipping.`);
                continue;
            }

            const res = await ProviderService.createOrder(order, qtyToOrder, { providerId: m.providerId, providerServiceId: m.providerServiceId.toString() });
            if (res.success) {
                success = true;
                const nextRun = order.currentRun + 1;
                const isFinished = nextRun >= order.runs;

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        externalId: res.externalId,
                        providerName: res.providerName, // Фиксируем текущего провайдера
                        status: 'PROCESSING',
                        currentRun: nextRun,
                        nextRunAt: isFinished ? null : new Date(Date.now() + order.interval * 60000),
                        providerRawResponse: res.rawData || { info: `Run ${nextRun} successful` }
                    }
                });

                if (!isFinished) {
                    await dripFeedQueue.add(`run-${order.id}-${nextRun + 1}`,
                        { orderId: order.id },
                        { delay: order.interval * 60000 }
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
                await dripFeedQueue.add(`delay-overlap-${order.id}`, { orderId: order.id }, { delay: 60 * 60000 });
                return;
            }
        }

        if (!success) {
            this.logger.error(`[Drip-feed] Run failed for order ${orderId} - all providers failed.`);
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


