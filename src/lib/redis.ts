/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import Redis from 'ioredis';
import { ConfigService } from './config.service';

const redisUrl = ConfigService.getSystemConfig().redisUrl;

// Edge Runtime не поддерживает ioredis. Нам нужно обходить это.
const isEdge = process.env.NEXT_RUNTIME === 'edge';
const isBuild =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.CI === 'true' ||
    process.env.NODE_ENV === 'test' ||
    process.env.DATABASE_URL?.includes('dummy') ||
    process.env.IS_BUILD === 'true';

const mockRedis = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    hget: async () => null,
    hset: async () => 0,
    exists: async () => 0,
    expire: async () => 0,
    on: () => { },
    quit: async () => 'OK',
};

let redis: any = mockRedis;

if (!isEdge && !isBuild) {
    const globalForRedis = global as unknown as { redis: Redis };
    if (!globalForRedis.redis) {
        try {
            const client = new Redis(redisUrl, {
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
                lazyConnect: true, // Не подключаться сразу
                retryStrategy(times) {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
            });

            client.on('error', (err) => {
                if (process.env.NODE_ENV === 'development') {
                    // В разработке просто выводим краткое сообщение
                    console.warn(`[Redis] Connection warning: ${err.message}`);
                } else {
                    console.error('[Redis] Error:', err);
                }
            });

            globalForRedis.redis = client;
        } catch (e) {
            console.error('[Redis] Critical initialization error:', e);
        }
    }
    redis = globalForRedis.redis;
}

export { redis };
export default redis;
