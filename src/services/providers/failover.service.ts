/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { ProviderService } from './provider.service';
import { OrderStatus } from '@prisma/client';

export class FailoverService {
    /**
     * Пытается переключить заказ на альтернативного провайдера,
     * если текущий считается зависшим или проблемным.
     */
    static async failoverOrder(orderId: number, adminId?: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                internalService: {
                    include: {
                        providerMappings: {
                            where: { isActive: true },
                            orderBy: { priority: 'asc' }
                        }
                    }
                }
            }
        });

        if (!order) throw new Error('Заказ не найден');

        console.log(`[Failover] Запуск переключения для заказа ${orderId} (Текущий провайдер: ${order.providerName})`);

        // 1. Пытаемся отменить текущий внешний заказ (КРИТИЧНАЯ ЗАЩИТА ОТ DOUBLE-SPEND)
        if (order.externalId && order.providerName) {
            try {
                const cancelResult = await ProviderService.cancelOrder(order as any);
                if (!cancelResult || !cancelResult.success) {
                    console.warn(`[Failover] Отмена заказа ${order.externalId} у провайдера ${order.providerName} не подтверждена. Переключение прервано для избежания двойного списания средств.`);
                    
                    await prisma.adminLog.create({
                        data: {
                            adminId: adminId || null,
                            action: 'FAILOVER_ABORTED',
                            details: `Заказ #${orderId} (Ext: ${order.externalId}) завис в PENDING у ${order.providerName}, но API не поддерживает авто-отмену. Требуется ручная отмена через тикет провайдеру перед ручным перезапуском.`
                        }
                    });
                    
                    // ПРЕРЫВАЕМ ФЕЙЛОВЕР: Нельзя создавать заказ у второго провайдера, если первый может его внезапно включить
                    return { success: false, error: 'Provider cancellation not supported or failed. Manual intervention required.' };
                }
                console.log(`[Failover] Предыдущий заказ ${order.externalId} отменен (подтверждено API)`);
            } catch (e: any) {
                console.warn(`[Failover] Ошибка сети при отмене заказа у провайдера: ${e.message}. Переключение прервано.`);
                return { success: false, error: `Cancellation network error: ${e.message}` };
            }
        }

        // 2. Ищем следующий маппинг
        const mappings = (order.internalService as any).providerMappings;

        // Пытаемся найти текущего провайдера в списке маппингов
        const currentProvider = await prisma.provider.findFirst({ where: { name: order.providerName || '' } });

        const nextMappingIndex = currentProvider
            ? mappings.findIndex((m: any) => m.providerId === currentProvider.id) + 1
            : 0;

        if (nextMappingIndex >= mappings.length || (nextMappingIndex === 0 && currentProvider)) {
            throw new Error('Нет доступных альтернативных провайдеров для этой услуги');
        }

        const nextMapping = mappings[nextMappingIndex];
        console.log(`[Failover] Переключение на провайдера ${nextMapping.providerId} (Priority: ${nextMapping.priority})`);

        // 3. Создаем новый заказ у провайдера
        try {
            const instance = await ProviderService.getInstance(nextMapping.providerId);
            if (!instance) {
                console.warn(`[Failover] Провайдер ${nextMapping.providerId} недоступен. Откладываем.`);
                return;
            }

            const result = await instance.createOrder(
                nextMapping.providerServiceId,
                order.link,
                order.quantity,
                { comments: order.comments || undefined }
            );

            if (result.success) {
                const provider = await prisma.provider.findUnique({ where: { id: nextMapping.providerId } });

                const meta = (order.metadata as Record<string, any>) || {};
                const providerHistory = meta.providerHistory || [];
                if (order.externalId && order.providerName) {
                    providerHistory.push({
                        externalId: order.externalId,
                        providerName: order.providerName,
                        status: order.status,
                        costPrice: order.costPrice ? Number(order.costPrice) : null,
                        timestamp: new Date().toISOString()
                    });
                    meta.providerHistory = providerHistory;
                }

                // 4. Обновляем заказ в БД
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        externalId: result.externalId,
                        providerName: provider?.name || 'Unknown',
                        status: 'PENDING', // Сбрасываем статус на Pending
                        updatedAt: new Date(),
                        metadata: meta
                    }
                });

                // 5. Логируем действие админа или системы
                await prisma.adminLog.create({
                    data: {
                        adminId: adminId || null,
                        action: 'ORDER_FAILOVER',
                        details: `Order #${orderId} switched from ${order.providerName} to ${provider?.name}. New External ID: ${result.externalId}`
                    }
                });

                return { success: true, newExternalId: result.externalId };
            } else {
                console.error(`[Failover] Провайдер ${nextMapping.providerId} отклонил заказ. Заказ остается Pending до следующего цикла.`);
                return;
            }
        } catch (e: any) {
            console.error(`[Failover] Ошибка при переключении заказа ${orderId}:`, e.message);
        }
    }

    /**
     * Ищет заказы, которые "зависли" в статусе Pending дольше определенного времени
     */
    static async processStuckOrders() {
        const STUCK_THRESHOLD_MINUTES = 45;
        const threshDate = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000);

        const stuckOrders = await prisma.order.findMany({
            where: {
                status: 'PENDING',
                createdAt: { lt: threshDate },
                providerName: { not: null }
            },
            take: 10 // Берем по чуть-чуть
        });

        console.log(`[Failover] Найдено ${stuckOrders.length} потенциально зависших заказов`);

        for (const order of stuckOrders) {
            try {
                // Перед переключением проверяем статус еще раз через API
                const status = await ProviderService.getOrderStatus(order);

                // Если провайдер говорит, что заказ уже в работе или выполнен - не трогаем
                if (status.status !== 'PENDING' && status.status !== 'PROCESSING') {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { status: status.status as OrderStatus }
                    });
                    continue;
                }

                // Если реально висит долго в Pending - переключаем
                await this.failoverOrder(order.id);
            } catch (e: any) {
                console.error(`[Failover] Ошибка обработки зависшего заказа ${order.id}:`, e.message);
            }
        }
    }
}


