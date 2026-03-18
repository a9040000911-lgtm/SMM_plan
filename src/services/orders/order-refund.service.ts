/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus } from '@/generated/client';
import { Decimal } from 'decimal.js';
import { LedgerService } from '@/services/finance/ledger.service';
import { bot } from '@/services/bot/bot-registry';
import { NotificationTemplates } from '@/bot/utils/notification-templates';
import { formatAmount } from '@/utils/formatter';
import { OrderWithRelations } from '@/types/orders';
import { createLogger } from '@/lib/logger';

export class OrderRefundService {
    private static logger = createLogger('OrderRefundService');

    /**
     * Атомарный возврат средств за заказ (автоматический)
     */
    static async handleRefund(o: OrderWithRelations, newS: OrderStatus, rem: number, providerRawResponse?: any) {
        const qty = newS === 'CANCELED' ? o.quantity : rem;
        if (qty <= 0) return;

        // Расчитываем сумму к возврату пропорционально остатку
        const amtToRefund = o.totalPrice.mul(qty).div(o.quantity);

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. АТОМАРНАЯ ПРОВЕРКА И ОБНОВЛЕНИЕ
            const updateResult = await tx.order.updateMany({
                where: {
                    id: o.id,
                    refundedAmount: { lt: o.totalPrice }
                },
                data: {
                    status: newS,
                    remains: rem,
                    refundedAmount: { increment: amtToRefund },
                    ...(providerRawResponse ? { providerRawResponse } : {})
                }
            });

            if (updateResult.count === 0) {
                this.logger.warn(`[Refund Protection] Blocked concurrent refund attempt for order ${o.id}`);
                return;
            }

            const order = await tx.order.findUnique({ where: { id: o.id } });
            if (!order) return;

            // 3. ЗАПИСЬ В LEDGER
            await LedgerService.record(tx, order.userId, amtToRefund, 'REFUND', order.id.toString(), `Возврат за невыполненную часть заказа (#${order.id})`);

            // 4. Обновляем баланс пользователя
            await tx.user.update({
                where: { id: order.userId },
                data: {
                    balance: { increment: amtToRefund },
                    spent: { decrement: Decimal.min(amtToRefund, order.totalPrice) }
                }
            });

            // 5. Создаем транзакцию для истории
            await tx.transaction.create({
                data: {
                    projectId: order.projectId,
                    userId: order.userId,
                    orderId: order.id,
                    amount: amtToRefund,
                    type: 'REFUND',
                    provider: 'INTERNAL',
                    status: 'COMPLETED',
                    metadata: { orderId: order.id, type: 'AUTO_REFUND' }
                }
            });

            if (newS === 'CANCELED' && order.promoCodeId) {
                await tx.userPromo.update({
                    where: { userId_promoCodeId: { userId: order.userId, promoCodeId: order.promoCodeId } },
                    data: { usedAt: null }
                }).catch(() => { });
            }
        });
    }

    /**
     * Ручной возврат (через админку)
     */
    static async processManualRefund(orderId: number, type: 'INTERNAL' | 'EXTERNAL', addBonus: boolean = false, adminId?: string) {
        const orderData = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true, internalService: true }
        }) as OrderWithRelations | null;

        if (!orderData || orderData.status === 'CANCELED') throw new Error('Заказ не найден или уже отменен');

        if (orderData.refundedAmount.gte(orderData.totalPrice)) {
            throw new Error('По этому заказу средства уже полностью возвращены');
        }

        const baseRefundAmount = orderData.totalPrice.minus(orderData.refundedAmount);
        const bonusAmount = addBonus ? orderData.totalPrice.mul(0.05) : new Decimal(0);
        const totalToReturn = baseRefundAmount.plus(bonusAmount);

        if (totalToReturn.lte(0)) throw new Error('Нет средств для возврата');

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.order.update({
                where: { id: orderData.id },
                data: {
                    status: 'CANCELED',
                    refundedAmount: { increment: baseRefundAmount }
                }
            });

            if (type === 'INTERNAL') {
                await LedgerService.record(tx, orderData.userId, totalToReturn, 'REFUND', orderData.id.toString(), `Ручной возврат средств админом (Бонус: ${addBonus})`);

                await tx.user.update({
                    where: { id: orderData.userId },
                    data: {
                        balance: { increment: totalToReturn },
                        spent: { decrement: baseRefundAmount }
                    }
                });

                await tx.transaction.create({
                    data: {
                        projectId: orderData.projectId,
                        userId: orderData.userId,
                        amount: totalToReturn,
                        type: 'REFUND',
                        provider: 'INTERNAL',
                        status: 'COMPLETED',
                        metadata: { orderId: orderData.id, bonus: addBonus ? '5%' : '0%', type: 'MANUAL_REFUND' }
                    }
                });

                if (adminId) {
                    await tx.adminLog.create({
                        data: {
                            adminId,
                            action: 'MANUAL_REFUND_INTERNAL',
                            targetId: orderData.id.toString(),
                            details: `Возврат ${formatAmount(totalToReturn)}₽ на баланс (Бонус: ${addBonus})`
                        }
                    });
                }

                const bonusMsg = addBonus ? `\n🎁 <b>+ Бонус лояльности за неудобства!</b>` : '';
                await bot.telegram.sendMessage(Number(orderData.user.tgId),
                    NotificationTemplates.FINANCE.REFUND_INTERNAL_USER(orderData.id, formatAmount(totalToReturn), bonusMsg),
                    { parse_mode: 'HTML' }
                ).catch(this.logger.error);
            }
            else if (type === 'EXTERNAL') {
                await tx.transaction.create({
                    data: {
                        projectId: orderData.projectId,
                        userId: orderData.userId,
                        amount: baseRefundAmount,
                        type: 'REFUND',
                        provider: 'YOOKASSA',
                        status: 'COMPLETED',
                        metadata: { orderId: orderData.id, note: 'Ручной возврат на карту' }
                    }
                });

                await tx.user.update({
                    where: { id: orderData.userId },
                    data: { spent: { decrement: baseRefundAmount } }
                });

                if (adminId) {
                    await tx.adminLog.create({
                        data: {
                            adminId,
                            action: 'MANUAL_REFUND_EXTERNAL',
                            targetId: orderData.id.toString(),
                            details: `Возврат ${formatAmount(baseRefundAmount)}₽ на карту`
                        }
                    });
                }

                await bot.telegram.sendMessage(Number(orderData.user.tgId),
                    NotificationTemplates.FINANCE.REFUND_EXTERNAL_USER(orderData.id, formatAmount(baseRefundAmount)),
                    { parse_mode: 'HTML' }
                ).catch(this.logger.error);
            }
        });

        return totalToReturn;
    }
}


