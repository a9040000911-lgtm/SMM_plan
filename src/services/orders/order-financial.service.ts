/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { LedgerService } from '@/services/finance/ledger.service';
import { Decimal } from 'decimal.js';
import { Prisma, OrderStatus } from '@/generated/client';
import { OrderWithRelations } from '@/types/orders';

export class OrderFinancialService {
    /**
     * Списывает средства с баланса пользователя за заказ.
     */
    static async chargeOrder(tx: Prisma.TransactionClient, userId: string, amount: Decimal, orderId: number, serviceName: string) {
        // 1. Запись в Ledger
        await LedgerService.record(tx, userId, amount, 'WITHDRAWAL', orderId.toString(), `Оплата заказа ${serviceName}`);

        // 2. Атомарное списание с баланса
        const updated = await tx.user.updateMany({
            where: {
                id: userId,
                balance: { gte: amount }
            },
            data: {
                balance: { decrement: amount },
                spent: { increment: amount }
            }
        });

        if (updated.count === 0) {
            throw new Error(`Заказ <code>#${orderId}</code> не может быть запущен из-за временного технического сбоя на стороне сервиса.\n\n`);
        }

        // 3. Создание транзакции оплаты
        await tx.transaction.create({
            data: {
                userId,
                orderId,
                amount,
                type: 'ORDER_PAYMENT',
                provider: 'INTERNAL',
                status: 'COMPLETED'
            }
        });
    }

    /**
     * Выполняет возврат средств за заказ (полный или частичный).
     */
    static async refundOrder(tx: Prisma.TransactionClient, order: OrderWithRelations, amount: Decimal, newStatus: OrderStatus, remains: number, reason: string) {
        // 1. Атомарная защита от повторных возвратов
        const updateResult = await tx.order.updateMany({
            where: {
                id: order.id,
                refundedAmount: { lt: order.totalPrice }
            },
            data: {
                status: newStatus,
                remains: remains,
                refundedAmount: { increment: amount }
            }
        });

        if (updateResult.count === 0) {
            console.warn(`[OrderFinancial] Blocked concurrent refund for order ${order.id}`);
            return;
        }

        // 2. Запись в Ledger
        await LedgerService.record(tx, order.userId, amount, 'REFUND', order.id.toString(), reason);

        // 3. Возврат на баланс
        await tx.user.update({
            where: { id: order.userId },
            data: {
                balance: { increment: amount },
                spent: { decrement: Decimal.min(amount, order.totalPrice) }
            }
        });

        // 4. Транзакция для истории
        await tx.transaction.create({
            data: {
                projectId: order.projectId,
                userId: order.userId,
                orderId: order.id,
                amount: amount,
                type: 'REFUND',
                provider: 'INTERNAL',
                status: 'COMPLETED',
                metadata: { orderId: order.id, type: 'AUTO_REFUND', reason }
            }
        });
    }
}
