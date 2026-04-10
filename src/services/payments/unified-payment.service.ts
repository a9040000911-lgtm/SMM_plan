/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { PaymentProviderFactory } from './payment-provider.factory';
import { Decimal } from 'decimal.js';

export interface UnifiedPaymentResult {
    success: boolean;
    confirmationUrl?: string;
    transactionId?: string;
    paymentId?: string;
    error?: string;
}

const LEGAL_PAYMENT_DESCRIPTION = 'Пополнение личного кабинета пользователя';

/**
 * Unified Payment Service - централизованный сервис для создания платежей
 * Используется как в web app, так и в Telegram боте
 * Single source of truth для всей payment логики
 */
export class UnifiedPaymentService {
    /**
     * Создает платеж с автоматическим определением провайдера из настроек проекта
     * Создает транзакцию в БД и инициирует платеж через выбранный провайдер
     * 
     * @param projectId - ID проекта
     * @param userId - ID пользователя
     * @param amount - Сумма платежа
     * @param description - Описание платежа
     * @param metadata - Дополнительные данные (source: 'BOT' | 'WEB', etc.)
     * @returns Результат с URL для оплаты
     */
    static async createPayment(
        projectId: string,
        userId: string,
        amount: number,
        description: string,
        metadata?: Record<string, any>
    ): Promise<UnifiedPaymentResult> {
        try {
            // [FIX 3.4] Idempotency Protection: Preventing double-clicks for identical deposit forms
            const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
            const recentPending = await prisma.transaction.findFirst({
                where: {
                    userId,
                    amount: new Decimal(amount),
                    status: 'PENDING',
                    createdAt: { gte: thirtySecondsAgo }
                }
            });

            if (recentPending && recentPending.externalId) {
                 // Return the already generated URL if user double clicked within 30 seconds
                 const url = recentPending.metadata && typeof recentPending.metadata === 'object' && 'paymentUrl' in recentPending.metadata 
                     ? (recentPending.metadata as any).paymentUrl 
                     : await (await PaymentProviderFactory.getProviderForProject(projectId)).createPayment(projectId, amount, recentPending.id, description).then(p => p.confirmationUrl);
                 
                 if (url) {
                      return { success: true, confirmationUrl: url, transactionId: recentPending.id, paymentId: recentPending.externalId };
                 }
            }

            // 1. Получаем провайдер из settings проекта (YooKassa или Robokassa)
            const provider = await PaymentProviderFactory.getProviderForProject(projectId);
            const providerName = provider.constructor.name === 'YooKassaProvider' ? 'YOOKASSA' : 'ROBOKASSA';

            // 2. Создаем транзакцию СНАЧАЛА (для tracking)
            const transaction = await prisma.transaction.create({
                data: {
                    projectId,
                    userId,
                    amount: new Decimal(amount),
                    type: 'DEPOSIT',
                    provider: providerName,
                    status: 'PENDING',
                    metadata: {
                        ...metadata,
                        description,
                        createdAt: new Date().toISOString()
                    }
                }
            });

            // 3. Создаем платеж через провайдер
            // Для Юридической безопасности (ЮKassa/Robokassa) пишем нейтральное описание
            const payment = await provider.createPayment(
                projectId,
                amount,
                transaction.id, // transaction.id используется как orderId для tracking
                LEGAL_PAYMENT_DESCRIPTION
            );

            if (!payment.confirmationUrl) {
                // Если провайдер не вернул URL - помечаем транзакцию как FAILED
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'ERROR' }
                });
                throw new Error('Payment provider did not return confirmation URL');
            }

            // 4. Обновляем транзакцию с externalId от провайдера
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    externalId: payment.id,
                    metadata: {
                        ...transaction.metadata as any,
                        paymentUrl: payment.confirmationUrl,
                        paymentId: payment.id,
                        provider: providerName,
                        createdAt: new Date().toISOString()
                    }
                }
            });

            return {
                success: true,
                confirmationUrl: payment.confirmationUrl,
                transactionId: transaction.id,
                paymentId: payment.id
            };
        } catch (error: any) {
            console.error('[UnifiedPaymentService] Error:', error);
            return {
                success: false,
                error: error.message || 'Payment creation failed'
            };
        }
    }

    /**
     * Создает платеж для заказа с учетом баланса пользователя
     * Если баланса достаточно - возвращает null (платеж не нужен)
     * Если недостаточно - создает платеж на разницу
     * 
     * @param projectId - ID проекта
     * @param userId - ID пользователя
     * @param totalAmount - Общая стоимость заказа
     * @param userBalance - Текущий баланс пользователя
     * @param description - Описание платежа
     * @param metadata - Дополнительные данные
     * @returns Результат создания платежа или null
     */
    static async createOrderPayment(
        projectId: string,
        userId: string,
        totalAmount: Decimal,
        userBalance: Decimal,
        description: string,
        metadata?: Record<string, any>
    ): Promise<UnifiedPaymentResult | null> {
        // Если баланса достаточно - платеж не нужен
        if (userBalance.gte(totalAmount)) {
            return null;
        }

        // Вычисляем сумму доплаты
        const amountToPay = totalAmount.minus(userBalance).toNumber();

        return this.createPayment(
            projectId,
            userId,
            amountToPay,
            description,
            {
                ...metadata,
                orderAmount: totalAmount.toNumber(),
                userBalance: userBalance.toNumber(),
                amountToPay
            }
        );
    }

    /**
     * Проверяет статус платежа через провайдер
     * Используется для проверки состояния pending платежей
     */
    static async checkPaymentStatus(
        _projectId: string,
        _externalId: string
    ): Promise<{ success: boolean; status: string; raw?: any }> {
        try {
            const _provider = await PaymentProviderFactory.getProviderForProject(_projectId);

            // Note: пока у нас нет метода getPaymentStatus в IPaymentProvider
            // Это можно добавить позже при необходимости
            console.warn('[UnifiedPaymentService] checkPaymentStatus not implemented yet');

            return {
                success: false,
                status: 'unknown'
            };
        } catch (error: any) {
            console.error('[UnifiedPaymentService] Check status error:', error);
            return {
                success: false,
                status: 'error',
                raw: error.message
            };
        }
    }
}


