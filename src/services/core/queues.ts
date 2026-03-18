/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Queue } from 'bullmq';

// Конфигурация соединения
export const getRedisConfig = () => {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379');

  if (process.env.REDIS_URL) {
    try {
      const url = new URL(process.env.REDIS_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port) || port,
      };
    } catch {
      // Fallback
    }
  }

  return { host, port };
};


const createQueue = (name: string, opts?: any) => {
  const isBuild =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.CI === 'true' ||
    process.env.NODE_ENV === 'test' ||
    process.env.IS_BUILD === 'true' ||
    process.env.NO_REDIS_CONNECTION === 'true';

  if (isBuild) {
    // Return a dummy object that mimics Queue for build time
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'add') return async () => ({ id: 'mock-id' });
        if (prop === 'close') return async () => { };
        return async () => { };
      }
    }) as unknown as Queue;
  }
  return new Queue(name, { ...opts, connection: getRedisConfig() });
};

// 1. Очередь для создания заказов (Process Pending)
export const orderQueue = createQueue('order-processing', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }, // Повтор через 5с, 10с, 20с при ошибках
    removeOnComplete: true,
  }
});

// 2. Очередь для синхронизации статусов
export const syncQueue = createQueue('status-sync', {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000,
  }
});

// 3. Очередь для капельной подачи (Drip-feed)
export const dripFeedQueue = createQueue('drip-feed', {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: true,
  }
});

// 4. Очередь для финансового аудита (Reconciliation)
export const auditQueue = createQueue('fin-audit');

// 5. Очередь для проверки балансов
export const balanceQueue = createQueue('balance-checks');

// 6. Очередь для переключения провайдеров (Smart Failover)
export const failoverQueue = createQueue('order-failover', {
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: true,
  }
});

// 7. Очередь для авто-мониторинга (Delayed Post Processing)
export const autoMonitoringQueue = createQueue('auto-monitoring', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
    removeOnComplete: true,
  }
});

// 8. Очередь для отложенных заказов (Scheduled Orders)
export const scheduledOrderQueue = createQueue('scheduled-orders', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: true,
  }
});


