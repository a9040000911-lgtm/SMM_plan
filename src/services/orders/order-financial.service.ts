/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { LedgerService } from '@/services/finance/ledger.service';
import { Decimal } from 'decimal.js';
import { Prisma, OrderStatus } from '@/generated/client';
import { OrderWithRelations } from '@/types/orders';
import { UserRepository } from '@/services/repositories/user.repository';
import { TransactionRepository } from '@/services/repositories/transaction.repository';
import { OrderRepository } from '@/services/repositories/order.repository';

export class OrderFinancialService {
    /**
     * Списывает средства с баланса пользователя за заказ.
     */
    static async chargeOrder(tx: Prisma.TransactionClient, userId: string, amount: Decimal, orderId: number, serviceName: string) {
        // 1. Запись в Ledger
        await LedgerService.record(tx, userId, amount, 'WITHDRAWAL', orderId.toString(), `Оплата заказа ${serviceName}`);

        // 2. Атомарное списание с баланса (amount - положительный Decimal, передаем как отрицательный для списания)
        const withdrawalSuccess = await UserRepository.updateBalance(userId, amount.negated(), amount, tx);

        if (!withdrawalSuccess) {
            throw new Error(`Заказ <code>#${orderId}</code> не может быть запущен из-за временного технического сбоя на стороне сервиса.\n\n`);
        }

        // 3. Создание транзакции оплаты
        await TransactionRepository.create({
            userId,
            orderId,
            amount,
            type: 'ORDER_PAYMENT',
            provider: 'INTERNAL',
            status: 'COMPLETED'
        }, tx);
    }

    /**
     * Выполняет возврат средств за заказ (полный или частичный).
     */
    static async refundOrder(tx: Prisma.TransactionClient, order: OrderWithRelations, amount: Decimal, newStatus: OrderStatus, remains: number, reason: string) {
        // 1. Атомарная защита от повторных возвратов (через Repository)
        const withdrawalSuccess = await OrderRepository.atomicRefundUpdate(
            order.id,
            order.totalPrice,
            {
                status: newStatus,
                remains: remains,
                refundedAmount: { increment: amount }
            },
            tx
        );

        if (!withdrawalSuccess) {
            console.warn(`[OrderFinancial] Blocked concurrent refund for order ${order.id}`);
            return;
        }

        // 2. Запись в Ledger
        await LedgerService.record(tx, order.userId, amount, 'REFUND', order.id.toString(), reason);

        // 3. Возврат на баланс
        // Передаем положительный amount для пополнения, и отрицательный для уменьшения spent
        const refundSpendDelta = Decimal.min(amount, order.totalPrice).negated();
        await UserRepository.updateBalance(order.userId, amount, refundSpendDelta, tx);

        // 4. Транзакция для истории
        await TransactionRepository.create({
            projectId: order.projectId,
            userId: order.userId,
            orderId: order.id,
            amount: amount,
            type: 'REFUND',
            provider: 'INTERNAL',
            status: 'COMPLETED',
            metadata: { orderId: order.id, type: 'AUTO_REFUND', reason }
        }, tx);
    }
}


