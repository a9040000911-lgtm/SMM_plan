/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Worker, Job } from 'bullmq';
import { ProviderService } from '@/services/providers';

import { getRedisConfig } from '@/lib/queues';

const connection = getRedisConfig();

export const balanceWorker = new Worker('balance-checks', async (job: Job) => {
    console.log(`[Worker] Running balance check (Job ID: ${job.id})`);
    await ProviderService.checkBalancesForAlerts();
}, { connection });

balanceWorker.on('failed', (job, err) => {
    console.error(`[Worker] Balance Job ${job?.id} failed:`, err);
});
