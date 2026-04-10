/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus } from '@prisma/client';
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
        // Защита от багов API внешних провайдеров: remains никогда не может превышать изначальное количество заказа.
        // Если провайдер вернет rem = 1000 для заказа на 10, мы вернем только за 10.
        const requestedQty = newS === 'CANCELED' ? o.quantity : rem;
        const qty = Math.min(requestedQty, o.quantity);
        
        if (qty <= 0) return;

        // Расчитываем сумму к возврату пропорционально остатку
        const amtToRefund = o.totalPrice.mul(qty).div(o.quantity);

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Читаем актуальное состояние заказа ВНУТРИ транзакции для атомарного cap
            const currentOrder = await tx.order.findUnique({
                where: { id: o.id },
                select: { id: true, refundedAmount: true, totalPrice: true, status: true }
            });
            if (!currentOrder) return;

            // Вычисляем реальный остаток для возврата (cap)
            const alreadyRefunded = currentOrder.refundedAmount;
            const maxRefundable = currentOrder.totalPrice.minus(alreadyRefunded);

            // Если уже возвращено всё — блокируем (защита от double refund)
            if (maxRefundable.lte(0)) {
                this.logger.warn(`[Refund Protection] Blocked refund for order ${o.id}: already fully refunded`);
                return;
            }

            // Обрезаем сумму до оставшегося лимита
            const clampedAmount = Decimal.min(amtToRefund, maxRefundable);

            // 2. АТОМАРНОЕ ОБНОВЛЕНИЕ с точной суммой
            const updateResult = await tx.order.updateMany({
                where: {
                    id: o.id,
                    refundedAmount: { lt: o.totalPrice }
                },
                data: {
                    status: newS,
                    remains: rem,
                    refundedAmount: { increment: clampedAmount },
                    ...(providerRawResponse ? { providerRawResponse } : {})
                }
            });

            if (updateResult.count === 0) {
                this.logger.warn(`[Refund Protection] Blocked concurrent refund attempt for order ${o.id}`);
                return;
            }

            const order = await tx.order.findUnique({ where: { id: o.id } });
            if (!order) return;

            // 4. Обновляем баланс пользователя
            const updatedUserRef = await tx.$queryRaw<any[]>`
                UPDATE "User"
                SET "balance" = "balance" + ${clampedAmount},
                    "spent" = "spent" - ${Decimal.min(clampedAmount, order.totalPrice)}
                WHERE "id" = ${order.userId}
                RETURNING "balance"
            `;
            
            const exactBalanceAfter = new Decimal(updatedUserRef[0].balance);

            // 3. ЗАПИСЬ В LEDGER (перемещено ПОСЛЕ update для точного баланса)
            await LedgerService.record(tx, order.userId, clampedAmount, 'REFUND', order.id.toString(), `Возврат за невыполненную часть заказа (#${order.id})`, undefined, exactBalanceAfter);

            // 5. Создаем транзакцию для истории
            await tx.transaction.create({
                data: {
                    projectId: order.projectId,
                    userId: order.userId,
                    orderId: order.id,
                    amount: clampedAmount,
                    type: 'REFUND',
                    provider: 'INTERNAL',
                    status: 'COMPLETED',
                    metadata: { orderId: order.id, type: 'AUTO_REFUND' }
                }
            });

            // 6. B2B Billing Refund (If applicable)
            if (order.projectId && order.costPrice && order.costPrice.gt(0)) {
                const project = await tx.project.findUnique({ where: { id: order.projectId }});
                if (project?.organizationId) {
                    const { B2BPricingService } = await import('@/services/finance/b2b-pricing.service');
                    const { OrganizationLedgerService } = await import('@/services/finance/organization-ledger.service');
                    
                    const isExempt = await B2BPricingService.isBillingExempt(project.organizationId);
                    if (!isExempt) {
                        // Рассчитываем сумму B2B возврата пропорционально количеству невыполненных единиц, 
                        // с учетом того, что это может быть дробная часть.
                        // amtToB2bRefund = costPrice * (qty / order.quantity)
                        const b2bRefundAmount = order.costPrice.mul(qty).div(order.quantity).toDecimalPlaces(2, Decimal.ROUND_FLOOR);
                        
                        if (b2bRefundAmount.gt(0)) {
                            // Возвращаем средства на masterBalance Организации
                            await OrganizationLedgerService.recordTransaction(tx, {
                                organizationId: project.organizationId,
                                amount: b2bRefundAmount,
                                type: 'REFUND',
                                description: `[B2B Auto-Refund] Partial refund for ${qty} items on Order #${order.id}`,
                                referenceId: order.id.toString()
                            });
                        }
                    }
                }
            }

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
            // Атомарный захват для предотвращения гонки при ручном возврате (Race Condition Lock)
            const captureLock = await tx.order.updateMany({
                where: { 
                    id: orderData.id,
                    status: { not: 'CANCELED' },
                    refundedAmount: { lt: orderData.totalPrice }
                },
                data: {
                    status: 'CANCELED',
                    refundedAmount: { increment: baseRefundAmount }
                }
            });

            if (captureLock.count === 0) {
                throw new Error('Заказ уже был отменен или средства возвращены параллельным процессом.');
            }

            // 2. B2B Billing Refund (If applicable)
            if (orderData.projectId && orderData.costPrice && orderData.costPrice.gt(0)) {
                // Determine how much of the original cost was not yet refunded to B2B
                const { B2BPricingService } = await import('@/services/finance/b2b-pricing.service');
                const { OrganizationLedgerService } = await import('@/services/finance/organization-ledger.service');

                const project = await tx.project.findUnique({ where: { id: orderData.projectId } });
                
                if (project?.organizationId) {
                    const isExempt = await B2BPricingService.isBillingExempt(project.organizationId);
                    if (!isExempt) {
                        // Рассчитываем процент отрозмещенного возврата, чтобы вернуть столько же B2B Cost
                        // baseRefundAmount - это то, что мы сейчас возвращаем Retail пользователю
                        // Но B2B Cost (costPrice) мы должны вернуть пропорционально.
                        const refundRatio = baseRefundAmount.div(orderData.totalPrice);
                        const b2bRefundAmount = orderData.costPrice.mul(refundRatio).toDecimalPlaces(2, Decimal.ROUND_FLOOR);

                        if (b2bRefundAmount.gt(0)) {
                            await OrganizationLedgerService.recordTransaction(tx, {
                                organizationId: project.organizationId,
                                amount: b2bRefundAmount,
                                type: 'REFUND',
                                description: `[B2B Manual-Refund] Refund ratio ${refundRatio.mul(100).toFixed(0)}% on Order #${orderData.id}`,
                                referenceId: orderData.id.toString()
                            });
                        }
                    }
                }
            }

            if (type === 'INTERNAL') {
                const userManualUpdate = await tx.$queryRaw<any[]>`
                    UPDATE "User"
                    SET "balance" = "balance" + ${totalToReturn},
                        "spent" = "spent" - ${baseRefundAmount}
                    WHERE "id" = ${orderData.userId}
                    RETURNING "balance"
                `;
                const manualExactBalanceAfter = new Decimal(userManualUpdate[0].balance);

                await LedgerService.record(tx, orderData.userId, totalToReturn, 'REFUND', orderData.id.toString(), `Ручной возврат средств админом (Бонус: ${addBonus})`, undefined, manualExactBalanceAfter);

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
                            adminId: adminId,
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
                            adminId: adminId,
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


