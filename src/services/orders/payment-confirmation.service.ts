/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { LedgerService } from '@/services/finance/ledger.service';
import { BotRegistry, bot } from '@/lib/bot';
import { formatAmount } from '@/utils/formatter';
import { PromoService } from '@/services/users/promo.service';
import { ReferralService } from '@/services/users/referral.service';
import { PricingService } from '@/services/finance/pricing.service';
import { ConfigService } from '@/lib/config.service';
import { NotificationTemplates } from '@/bot/utils/notification-templates';
import { Decimal } from 'decimal.js';
import { OrderMetadata, OrderWithRelations } from '@/types/orders';
import { PaymentService } from '@/services/finance/payment.service';
import { OrderQueueService } from './order-queue.service';
import { OrderActivationService } from './order-activation.service';
import { Prisma } from '@/generated/client';
import { createLogger } from '@/lib/logger';

export class PaymentConfirmationService {
    private static logger = createLogger('PaymentConfirmationService');

    /**
     * Подтверждает платеж и активирует заказы.
     */
    static async confirmPayment(paymentId: string) {
        const tx = await prisma.transaction.findFirst({
            where: { externalId: paymentId, status: 'PENDING', provider: 'YOOKASSA' },
            include: { user: true }
        });

        if (!tx) return false;

        await prisma.$transaction(async (txPrisma: Prisma.TransactionClient) => {
            // 1. ЗАПИСЬ В LEDGER (ПОПОЛНЕНИЕ)
            await LedgerService.record(txPrisma, tx.userId, tx.amount, 'DEPOSIT', tx.id, 'Пополнение через YooKassa');

            const updatedUser = await txPrisma.user.update({ where: { id: tx.userId }, data: { balance: { increment: tx.amount } } });
            await txPrisma.transaction.update({ where: { id: tx.id }, data: { status: 'COMPLETED' } });

            try {
                await BotRegistry.get(tx.projectId).telegram.sendMessage(
                    Number(tx.user.tgId),
                    NotificationTemplates.FINANCE.DEPOSIT_SUCCESS_USER(
                        formatAmount(tx.amount),
                        formatAmount(updatedUser.balance)
                    ),
                    { parse_mode: 'HTML' }
                );
            } catch (_e) { this.logger.error('Failed to send payment confirmation:', _e); }

            await PromoService.checkLargeDeposit(tx.userId, Number(tx.user.tgId), tx.amount.toNumber(), txPrisma);
            await PromoService.processAutomationRules('DEPOSIT_GTE', { userId: tx.userId, tgId: Number(tx.user.tgId), value: tx.amount.toNumber(), projectId: tx.projectId || undefined }, txPrisma);

            await ReferralService.processReferralBonus(txPrisma, tx.userId, tx.amount, tx.id);

            if (tx.metadata && typeof tx.metadata === 'object') {
                const meta = tx.metadata as unknown as OrderMetadata;

                const processActivation = async (oid: string | number) => {
                    const orderId = typeof oid === 'string' ? parseInt(oid) : oid;
                    if (isNaN(orderId)) return;

                    const existingOrder = (await txPrisma.order.findUnique({
                        where: { id: orderId },
                        include: { internalService: true }
                    })) as OrderWithRelations | null;

                    if (existingOrder && (existingOrder.status as string) === 'AWAITING_PAYMENT') {
                        const costPrice = existingOrder.internalService.lastProviderPrice
                            ? (existingOrder.internalService.lastProviderPrice as Decimal).mul(existingOrder.quantity).div(1000)
                            : new Decimal(0);

                        await txPrisma.order.update({
                            where: { id: orderId },
                            data: {
                                status: 'PENDING',
                                costPrice: costPrice
                            }
                        });

                        await LedgerService.record(txPrisma, tx.userId, existingOrder.totalPrice, 'WITHDRAWAL', existingOrder.id.toString(), `Оплата заказа ${existingOrder.internalService.name}`);

                        const updatedUserAfter = await txPrisma.user.update({
                            where: { id: tx.userId },
                            data: {
                                spent: { increment: existingOrder.totalPrice },
                                balance: { decrement: existingOrder.totalPrice }
                            }
                        });

                        await txPrisma.transaction.create({
                            data: {
                                projectId: tx.projectId,
                                userId: tx.userId,
                                orderId: existingOrder.id,
                                amount: existingOrder.totalPrice,
                                type: 'ORDER_PAYMENT',
                                provider: 'INTERNAL',
                                status: 'COMPLETED'
                            }
                        });

                        if (updatedUserAfter.tgId) {
                            try {
                                await BotRegistry.get(tx.projectId).telegram.sendMessage(Number(updatedUserAfter.tgId), NotificationTemplates.ORDER.CREATED_USER(existingOrder.id, existingOrder.internalService.name), { parse_mode: 'HTML' });
                            } catch (err) { this.logger.error('Failed to send order notification:', err); }
                        }
                    }
                };

                if (meta.orderIds && Array.isArray(meta.orderIds)) {
                    for (const oid of meta.orderIds) {
                        await processActivation(oid);
                    }
                } else if (meta.orderId) {
                    await processActivation(meta.orderId);
                } else if (meta.serviceId && meta.qty && meta.link) {
                    const service = await txPrisma.internalService.findUnique({ where: { id: String(meta.serviceId) } });
                    if (!service) return;

                    const details = await PricingService.calculateOrderDetails(tx.userId, service.id, Number(meta.qty), tx.projectId || undefined);

                    await OrderActivationService.initiateOrder({
                        userId: tx.userId,
                        serviceId: service.id,
                        projectId: tx.projectId,
                        link: meta.link,
                        inviteLink: meta.inviteLink || undefined,
                        qty: meta.qty,
                        totalPrice: tx.amount,
                        costPrice: service.lastProviderPrice ? (service.lastProviderPrice as Decimal).mul(meta.qty).div(1000) : undefined,
                        discountAmount: details.discountAmount,
                        promoId: meta.promoId || undefined,
                        isDripFeed: !!meta.dripFeed,
                        dripFeed: meta.dripFeed,
                        username: tx.user.username || undefined,
                        tgId: Number(tx.user.tgId)
                    }, txPrisma);
                }
            }
        }, { timeout: 30000 }).catch(async (err) => {
            this.logger.error('[confirmPayment Error]', err);
            const telegramConfig = await ConfigService.getTelegramConfig();
            if (telegramConfig.adminId) {
                await bot.telegram.sendMessage(telegramConfig.adminId,
                    NotificationTemplates.FINANCE.PAYMENT_CRITICAL_ERROR_ADMIN(paymentId, err.message),
                    { parse_mode: 'HTML' }
                ).catch(console.error);
            }
            throw err;
        });

        OrderQueueService.processPendingOrders().catch(e => this.logger.error('Error in immediate order processing:', e));

        return true;
    }

    /**
     * Синхронизирует статусы платежей YooKassa
     */
    static async syncPaymentsStatus() {
        const pending = await prisma.transaction.findMany({ where: { status: 'PENDING', provider: 'YOOKASSA', externalId: { not: null } } });
        for (const tx of pending) {
            try {
                const data = await PaymentService.getPaymentStatus(tx.externalId!);

                if (data.success && data.status === 'succeeded') {
                    await this.confirmPayment(tx.externalId!);
                } else if (data.status === 'canceled') {
                    await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'ERROR' } });
                }
            } catch (_e) { this.logger.error(`Error syncing payment for tx ${tx.id}:`, _e); }
        }
    }
}
