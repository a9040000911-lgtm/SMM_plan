/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { OrderActivationService } from './order-activation.service';
import { Decimal } from 'decimal.js';
import { BotRegistry } from '@/services/bot/bot-registry';

export class ScheduledOrderService {
    /**
     * Обработка всех отложенных заказов, время которых наступило.
     */
    static async processPendingScheduledOrders() {
        const now = new Date();

        // 1. Находим все PENDING заказы, время которых наступило
        const pending = await prisma.scheduledOrder.findMany({
            where: {
                status: 'PENDING',
                scheduleTime: { lte: now }
            },
            select: { id: true }
        });

        if (pending.length === 0) return;

        console.log(`[ScheduledOrderService] Found ${pending.length} pending orders to process`);

        for (const item of pending) {
            try {
                await this.executeScheduledOrder(item.id);
            } catch (error) {
                console.error(`[ScheduledOrderService] Failed to process order ${item.id}:`, error);
            }
        }
    }

    /**
     * Выполнение конкретного отложенного заказа.
     * Использует транзакцию для безопасности и рекуррентности.
     */
    static async executeScheduledOrder(id: string) {
        return await prisma.$transaction(async (tx) => {
            // 1. Lock record and check status
            const scheduled = await tx.scheduledOrder.findUnique({
                where: { id },
                include: { user: { select: { balance: true } } }
            });

            if (!scheduled || scheduled.status !== 'PENDING') {
                return;
            }

            // 2. Check balance (Early Exit if definitely not enough)
            if (scheduled.totalPrice && scheduled.user.balance.lt(scheduled.totalPrice)) {
                await tx.scheduledOrder.update({
                    where: { id },
                    data: { status: 'FAILED' }
                });
                console.warn(`[ScheduledOrderService] Order ${id} failed: Insufficient balance`);

                // Notify user so they can top up and retry
                const userWithTg = await prisma.user.findUnique({
                    where: { id: scheduled.userId },
                    select: { tgId: true }
                });
                if (userWithTg?.tgId) {
                    BotRegistry.get(scheduled.projectId).telegram.sendMessage(
                        Number(userWithTg.tgId),
                        `⏰ <b>Отложенный заказ не выполнен!</b>\n\nНедостаточно средств на балансе.\nПополните счёт и создайте заказ заново.`,
                        { parse_mode: 'HTML' }
                    ).catch(() => { });
                }

                return;
            }

            try {
                // 3. Initiate the real order
                // Note: initiateOrder will also check balance and create a transaction if tx is not provided.
                // We pass tx to keep it atomic.
                const initiatedOrder = await OrderActivationService.initiateOrder({
                    userId: scheduled.userId,
                    serviceId: scheduled.serviceId,
                    projectId: scheduled.projectId,
                    link: scheduled.link,
                    qty: scheduled.quantity,
                    totalPrice: scheduled.totalPrice || new Decimal(0),
                    costPrice: scheduled.costPrice || undefined,
                    isManual: false
                }, tx as any);

                // 4. Update status to COMPLETED
                await tx.scheduledOrder.update({
                    where: { id },
                    data: { status: 'COMPLETED' }
                });

                // 5. Handle Recurrence
                if (scheduled.repeatInterval && scheduled.repeatInterval > 0) {
                    const nextTime = new Date(scheduled.scheduleTime.getTime() + scheduled.repeatInterval * 60000);

                    await tx.scheduledOrder.create({
                        data: {
                            userId: scheduled.userId,
                            serviceId: scheduled.serviceId,
                            projectId: scheduled.projectId,
                            link: scheduled.link,
                            quantity: scheduled.quantity,
                            totalPrice: scheduled.totalPrice,
                            costPrice: scheduled.costPrice,
                            scheduleTime: nextTime,
                            repeatInterval: scheduled.repeatInterval,
                            status: 'PENDING'
                        }
                    });
                }

                console.log(`[ScheduledOrderService] Successfully executed order ${id} -> Real Order ID: ${initiatedOrder.id}`);
                return initiatedOrder;

            } catch (error: any) {
                console.error(`[ScheduledOrderService] Error during execution of ${id}:`, error);

                await tx.scheduledOrder.update({
                    where: { id },
                    data: { status: 'FAILED' }
                });

                // Notify user about the failure
                const userWithTg = await prisma.user.findUnique({
                    where: { id: scheduled.userId },
                    select: { tgId: true }
                });
                if (userWithTg?.tgId) {
                    BotRegistry.get(scheduled.projectId).telegram.sendMessage(
                        Number(userWithTg.tgId),
                        `❌ <b>Ошибка отложенного заказа!</b>\n\nНе удалось запустить запланированный заказ из-за технической ошибки.\nПожалуйста, повторите попытку позже или обратитесь в поддержку.`,
                        { parse_mode: 'HTML' }
                    ).catch(() => { });
                }

                throw error;
            }
        });
    }

    /**
     * Принудительный запуск заказа админом.
     */
    static async forceRun(id: string) {
        return this.executeScheduledOrder(id);
    }
}


