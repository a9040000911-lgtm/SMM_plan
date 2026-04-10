/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Worker, Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { getRedisConfig } from '@/services/core/queues';
import { PaymentService } from '@/services/finance/payment.service';
import { SUBSCRIPTION_MONTHLY_PRICE } from '@/services/finance/subscription.service';

const connection = getRedisConfig();

/**
 * Воркер для автоматического биллинга (Recurring Billing via YooKassa)
 * Запускается по крону, например, раз в час
 */
export const billingWorker = new Worker('recurring-billing', async (job: Job) => {
  console.log(`[Worker] Running recurring billing checks (Job ID: ${job.id})`);

  // Ищем подписки, которые:
  // 1. Активны
  // 2. У которых включено автопродление
  // 3. Срок действия истекает менее чем через 24 часа (или уже истек)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      autoRenew: true,
      currentPeriodEnd: {
        lte: tomorrow
      },
      paymentMethodId: {
        not: null
      }
    }
  });

  if (dueSubscriptions.length === 0) {
    console.log('[Worker] No subscriptions due for renewal.');
    return;
  }

  console.log(`[Worker] Found ${dueSubscriptions.length} subscriptions due for auto-renewal.`);

  for (const sub of dueSubscriptions) {
    try {
      console.log(`[Worker] Attempting to charge user ${sub.userId} for Priority Pass renewal.`);
      
      const chargeResult = await PaymentService.chargeSavedMethod(
        SUBSCRIPTION_MONTHLY_PRICE,
        sub.userId,
        sub.paymentMethodId!
      );

      if (chargeResult.success) {
        console.log(`[Worker] Successfully charged user ${sub.userId}. Payment ID: ${chargeResult.paymentId}`);
        // Webhook от YooKassa обработает продление сроков в базе, когда платеж реально завершится
      } else {
        console.error(`[Worker] Failed to charge user ${sub.userId}. Error: ${chargeResult.error}`);
        // Помечаем подписку как PAST_DUE, если истек срок?
        // Пока просто логируем, можно добавить логику отмены, если много неудачных попыток
        if (sub.currentPeriodEnd < new Date()) {
           await prisma.subscription.update({
             where: { id: sub.id },
             data: { status: 'PAST_DUE' }
           });
        }
      }
    } catch (err) {
      console.error(`[Worker] Fatal error while processing billing for user ${sub.userId}:`, err);
    }
  }

}, { connection });
