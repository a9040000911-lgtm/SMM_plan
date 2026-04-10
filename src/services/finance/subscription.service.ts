/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { PaymentService } from './payment.service';

export const SUBSCRIPTION_MONTHLY_PRICE = 1990; // RUB

export class SubscriptionService {
    /**
     * Возвращает true, если у пользователя есть активная подписка (Priority Pass),
     * чей срок действия покрывает текущую дату.
     */
    static async checkActiveSubscription(userId: string): Promise<boolean> {
        const sub = await prisma.subscription.findUnique({
            where: { userId }
        });
        
        if (!sub) return false;
        
        if (sub.status === 'ACTIVE' && sub.currentPeriodEnd > new Date()) {
            return true;
        }
        
        return false;
    }

    /**
     * Создает YooKassa Checkout ссылку с флагом save_payment_method
     */
    static async createSubscriptionCheckout(userId: string, returnUrl: string) {
        // Убедимся, что мы не создаем платеж, если подписка уже активна
        if (await this.checkActiveSubscription(userId)) {
            throw new Error('У пользователя уже есть активная подписка Priority Pass.');
        }

        const result = await PaymentService.createSubscriptionPayment(
            SUBSCRIPTION_MONTHLY_PRICE,
            userId,
            returnUrl
        );

        if (!result.success) {
            throw new Error(result.error || 'Ошибка при создании подписки');
        }

        return result;
    }

    /**
     * Обрабатывает успешный webhook от YooKassa
     * Создает или продлевает подписку для пользователя.
     */
    static async handleSuccessfulPayment(userId: string, paymentMethodId: string, paymentId: string) {
        return prisma.$transaction(async (tx) => {
            const existingSub = await tx.subscription.findUnique({
                where: { userId }
            });

            // Подписка дается на 30 дней вперед
            const periodEnd = new Date();
            periodEnd.setDate(periodEnd.getDate() + 30);

            if (existingSub) {
                // Продляем
                await tx.subscription.update({
                    where: { id: existingSub.id },
                    data: {
                        status: 'ACTIVE',
                        currentPeriodEnd: periodEnd,
                        paymentMethodId: paymentMethodId,
                    }
                });
            } else {
                // Создаем впервые
                const user = await tx.user.findUnique({ where: { id: userId } });
                await tx.subscription.create({
                    data: {
                        userId,
                        projectId: user?.projectId,
                        status: 'ACTIVE',
                        currentPeriodEnd: periodEnd,
                        paymentMethodId: paymentMethodId,
                        autoRenew: true
                    }
                });
            }

            // Логируем оплату подписки как системный приход в Ledger (опционально, можно не трогать баланс пользователя)
            await tx.ledgerEntry.create({
                data: {
                    userId,
                    amount: SUBSCRIPTION_MONTHLY_PRICE,
                    type: 'SUBSCRIPTION_PAYMENT',
                    balanceBefore: 0, // Не затрагивает внутренний баланс
                    balanceAfter: 0,
                    referenceId: paymentId,
                    description: 'Оплата подписки Priority Pass'
                }
            });
        });
    }

    /**
     * Отключает автообновление подписки
     */
    static async cancelSubscription(userId: string) {
        const sub = await prisma.subscription.findUnique({ where: { userId } });
        if (!sub) throw new Error('Подписка не найдена');

        await prisma.subscription.update({
            where: { userId },
            data: { autoRenew: false }
        });
        
        return { success: true };
    }

    /**
     * Возобновляет автообновление подписки
     */
    static async resumeSubscription(userId: string) {
        const sub = await prisma.subscription.findUnique({ where: { userId } });
        if (!sub) throw new Error('Подписка не найдена');

        await prisma.subscription.update({
            where: { userId },
            data: { autoRenew: true }
        });
        
        return { success: true };
    }

    /**
     * Возвращает полную информацию о подписке (статус, автопродление, период)
     */
    static async getSubscriptionDetails(userId: string) {
        return prisma.subscription.findUnique({
            where: { userId }
        });
    }
}
