/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Worker, Job } from 'bullmq';
import { ScheduledOrderService } from '@/services/orders/scheduled-order.service';
import { getRedisConfig } from '@/services/core/queues';

const connection = getRedisConfig();

/**
 * Воркер для обработки отложенных заказов.
 * Запускается по расписанию через очередь 'scheduled-orders'.
 */
export const scheduledOrderWorker = new Worker('scheduled-orders', async (job: Job) => {
    console.log(`[Worker] Checking for scheduled orders (Job ID: ${job.id})`);
    await ScheduledOrderService.processPendingScheduledOrders();
}, { connection });

scheduledOrderWorker.on('failed', (job, err) => {
    console.error(`[Worker] Scheduled Order Job ${job?.id} failed:`, err);
});

scheduledOrderWorker.on('completed', (_job) => {
    // Silent success
});


