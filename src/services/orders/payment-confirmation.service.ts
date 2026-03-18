/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { LedgerService } from '@/services/finance/ledger.service';
import { BotRegistry, bot } from '@/services/bot/bot-registry';
import { formatAmount } from '@/utils/formatter';
import { PromoService } from '@/services/users/promo.service';
import { ReferralService } from '@/services/users/referral.service';
import { PaymentService } from '@/services/finance/payment.service';
import { ConfigService } from '@/services/core/config.service';
import { NotificationTemplates } from '@/bot/utils/notification-templates';
import { Prisma } from '@/generated/client';
import { createLogger } from '@/lib/logger';
import { eventBus } from '@/services/core/event-bus';

export class PaymentConfirmationService {
    private static logger = createLogger('PaymentConfirmationService');

    /**
     * Подтверждает платеж в базе данных и уведомляет систему через шину событий.
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

            await txPrisma.user.update({ where: { id: tx.userId }, data: { balance: { increment: tx.amount } } });
            await txPrisma.transaction.update({ where: { id: tx.id }, data: { status: 'COMPLETED' } });

            try {
                await BotRegistry.get(tx.projectId).telegram.sendMessage(
                    Number(tx.user.tgId),
                    NotificationTemplates.FINANCE.DEPOSIT_SUCCESS_USER(
                        formatAmount(tx.amount),
                        formatAmount(tx.user.balance.add(tx.amount))
                    ),
                    { parse_mode: 'HTML' }
                );
            } catch (_e) { this.logger.error('Failed to send payment confirmation:', _e); }

            await PromoService.checkLargeDeposit(tx.userId, Number(tx.user.tgId), tx.amount.toNumber(), txPrisma);
            await PromoService.processAutomationRules('DEPOSIT_GTE', { userId: tx.userId, tgId: Number(tx.user.tgId), value: tx.amount.toNumber(), projectId: tx.projectId || undefined }, txPrisma);

            await ReferralService.processReferralBonus(txPrisma, tx.userId, tx.amount, tx.id);

        }).then(async () => {
            // 2. ЭМИССИЯ СОБЫТИЯ (После фиксации транзакции в БД)
            eventBus.emit('PAYMENT_CONFIRMED', {
                txId: tx.id,
                userId: tx.userId,
                amount: tx.amount.toNumber(),
                orderMetadata: tx.metadata
            });
        }).catch(async (err) => {
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


