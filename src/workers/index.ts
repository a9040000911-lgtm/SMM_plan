/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Worker, Job } from 'bullmq';
import { processPendingOrders, syncPaymentsStatus } from '@/services/orders';
import { OrderSyncService } from '@/services/orders/order-sync.service';
import { ProviderService } from '@/services/providers';
import { RetentionService } from '@/services/users';
import { ReconciliationService } from '@/services/finance';
import { SmartSyncService } from '@/services/providers';
import { SelfHealingService } from '@/services/core';
import { AutoMonitoringService } from '@/services/orders';

import { getRedisConfig } from '@/lib/queues';

const connection = getRedisConfig();

/**
 * Воркер для обработки новых заказов
 */
export const orderWorker = new Worker('order-processing', async (job: Job) => {
  console.log(`[Worker] Processing pending orders (Job ID: ${job.id})`);
  await processPendingOrders();
}, { connection });

/**
 * Воркер для синхронизации статусов заказов и удержания
 */
export const syncWorker = new Worker('status-sync', async (job: Job) => {
  if (job.name === 'retention-check') {
    console.log('[Worker] Running Retention Check...');
    await RetentionService.runDailyCheck();
    return;
  }

  console.log(`[Worker] Syncing order statuses (Job ID: ${job.id})`);
  await OrderSyncService.syncAllActive();
  await syncPaymentsStatus();
  await ProviderService.checkAndLogAllBalances();

  // Авто-репрайсинг (раз в час или по расписанию очереди)
  await SmartSyncService.syncPricesAndMarkup();

  // Самолечение: полный цикл проверок стабильности и чистоты данных
  await SelfHealingService.runAllChecks();

  // Проверка новых постов (Авто-пилот)
  await AutoMonitoringService.checkNewPosts();
}, { connection });

/**
 * Воркер для финансового аудита
 */
export const auditWorker = new Worker('fin-audit', async (job: Job) => {
  console.log(`[Worker] Running financial reconciliation (Job ID: ${job.id})`);
  await ReconciliationService.auditAllUsers();
}, { connection });

// Обработка ошибок воркеров
orderWorker.on('failed', (job, err) => {
  console.error(`[Worker] Order Job ${job?.id} failed:`, err);
});

syncWorker.on('failed', (job, err) => {
  console.error(`[Worker] Sync Job ${job?.id} failed:`, err);
});

/**
 * Воркер для капельной подачи
 */
export const dripFeedWorker = new Worker('drip-feed', async (job: Job) => {
  const { orderId } = job.data;
  console.log(`[Worker] Executing drip-feed run for order ${orderId}`);
  // Логика будет реализована в order-processor.service
  const { processDripFeedRun } = await import('@/services/orders');
  await processDripFeedRun(orderId);
}, { connection });

auditWorker.on('failed', (job, err) => {
  console.error(`[Worker] Audit Job ${job?.id} failed:`, err);
});

dripFeedWorker.on('failed', (job, err) => {
  console.error(`[Worker] Drip-feed Job ${job?.id} for order ${job?.data.orderId} failed:`, err);
});

/**
 * Воркер для переключения зависших заказов
 */
export const failoverWorker = new Worker('order-failover', async (job: Job) => {
  console.log(`[Worker] Running stuck orders failover check (Job ID: ${job.id})`);
  const { FailoverService } = await import('@/services/providers/failover.service');
  await FailoverService.processStuckOrders();
}, { connection });

failoverWorker.on('failed', (job, err) => {
  console.error(`[Worker] Failover Job ${job?.id} failed:`, err);
});

/**
 * Воркер для отложенной обработки авто-мониторинга (Smart Pacing)
 */
export const autoMonitoringWorker = new Worker('auto-monitoring', async (job: Job) => {
  const { taskId, postUrl } = job.data;
  console.log(`[Worker] Processing delayed post for task ${taskId}: ${postUrl}`);

  const { AutoMonitoringService } = await import('@/services/orders/auto-monitoring.service');
  await AutoMonitoringService.processNewPost(taskId, postUrl);
}, { connection });

autoMonitoringWorker.on('failed', (job, err) => {
  console.error(`[Worker] Auto-Monitor Job ${job?.id} for task ${job?.data.taskId} failed:`, err);
});

// ... (previous code)

export * from './check-balance.job';
export * from './scheduled-orders.job';

console.log('--- BULLMQ WORKERS READY ---');
