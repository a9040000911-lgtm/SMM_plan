/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Worker, Job } from 'bullmq';
import { processPendingOrders, syncPaymentsStatus } from '@/services/orders';
import { OrderSyncService } from '@/services/orders/order-sync.service';
import { RetentionService } from '@/services/users';
import { ReconciliationService } from '@/services/finance';
import { SmartSyncService } from '@/services/providers/smart-sync.service';
import { SelfHealingService } from '@/services/core';
import { AutoMonitoringService } from '@/services/orders';

import { getRedisConfig } from '@/services/core/queues';
import { balanceWorker } from './check-balance.job';
import { scheduledOrderWorker } from './scheduled-orders.job';
import { billingWorker } from './billing.worker';

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

  // Прямой вызов BalanceMonitorService во избежание циклов в ProviderService
  const { BalanceMonitorService } = await import('@/services/providers/balance-monitor.service');
  await BalanceMonitorService.checkAndLogAllBalances();

  // Авто-репрайсинг (раз в час или по расписанию очереди)
  await SmartSyncService.syncPricesAndMarkup();

  // Самолечение: полный цикл проверок стабильности и чистоты данных
  await SelfHealingService.runAllChecks();

  // Проверка новых постов (Авто-пилот)
  await AutoMonitoringService.checkNewPosts();

  // Dead Man's Switch: автоматическое отключение Песочницы по TTL
  const { SandboxService } = await import('@/services/core/sandbox.service');
  await SandboxService.checkAutoDisable();
}, { connection });

/**
 * Воркер для финансового аудита
 */
export const auditWorker = new Worker('fin-audit', async (job: Job) => {
  console.log(`[Worker] Running financial reconciliation (Job ID: ${job.id})`);
  await ReconciliationService.auditAllUsers();
}, { connection });

/**
 * Воркер для капельной подачи
 */
export const dripFeedWorker = new Worker('drip-feed', async (job: Job) => {
  const { orderId } = job.data;
  console.log(`[Worker] Executing drip-feed run for order ${orderId}`);
  const { processDripFeedRun } = await import('@/services/orders');
  await processDripFeedRun(orderId);
}, { connection });

/**
 * Воркер для ручного переключения зависших заказов (ранее был автоматическим)
 * ОТКЛЮЧЕНО: Автоматический Failover по таймауту (45 мин) отключен по требованиям безопасности (Double-Spend).
 * Теперь Failover срабатывает только при статусе CANCELED от провайдера (через OrderSyncService).
 */
export const failoverWorker = new Worker('order-failover', async (job: Job) => {
  // console.log(`[Worker] Running stuck orders failover check (Job ID: ${job.id})`);
  // const { FailoverService } = await import('@/services/providers/failover.service');
  // await FailoverService.processStuckOrders();
  console.log(`[Worker] Cron Failover aborted. PENDING orders wait for manual tech-support intervention.`);
}, { connection });

/**
 * Воркер для отложенной обработки авто-мониторинга (Smart Pacing)
 */
export const autoMonitoringWorker = new Worker('auto-monitoring', async (job: Job) => {
  const { taskId, postUrl } = job.data;
  console.log(`[Worker] Processing delayed post for task ${taskId}: ${postUrl}`);

  const { AutoMonitoringService } = await import('@/services/orders/auto-monitoring.service');
  await AutoMonitoringService.processNewPost(taskId, postUrl);
}, { connection });

// Собираем все воркеры в массив для управления
export const allWorkers = [
  orderWorker,
  syncWorker,
  auditWorker,
  dripFeedWorker,
  failoverWorker,
  autoMonitoringWorker,
  balanceWorker,
  scheduledOrderWorker,
  billingWorker
];

// Обработка ошибок воркеров
allWorkers.forEach(worker => {
  worker.on('failed', (job, err) => {
    console.error(`[Worker] ${worker.name} Job ${job?.id} failed:`, err);
  });
});

/**
 * Функция для корректного завершения всех воркеров (Graceful Shutdown)
 */
export async function stopAllWorkers() {
  console.log('[Worker] Graceful shutdown initiated. Stopping all workers...');
  await Promise.all(allWorkers.map(worker => worker.close()));
  console.log('[Worker] All BullMQ workers stopped successfully.');
}

export * from './check-balance.job';
export * from './scheduled-orders.job';

console.log('--- BULLMQ WORKERS READY ---');
