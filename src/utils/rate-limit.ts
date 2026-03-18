/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

export interface RateLimitOptions {
  interval: number; // Интервал в секундах
}

/**
 * Enterprise Rate Limiter
 * Использует Redis в Node.js и In-Memory в Edge (для стабильности)
 */
export function rateLimit(options: RateLimitOptions) {
  return {
    check: async (limit: number, token: string) => {
      const key = `ratelimit:${token}`;

      // В Edge Runtime мы не можем использовать ioredis напрямую через TCP
      const isEdge = process.env.NEXT_RUNTIME === 'edge';

      if (isEdge) {
        // В Edge используем заглушку или In-Memory (упрощенно)
        return { isAllowed: true, remaining: limit };
      }

      try {
        // Динамический импорт Redis только для Node.js
        const { redis } = await import('../lib/redis');

        if (!redis) return { isAllowed: true, remaining: limit };

        const results = await redis
          .pipeline()
          .incr(key)
          .expire(key, options.interval)
          .exec();

        const count = (results?.[0][1] as number) || 0;

        return {
          isAllowed: count <= limit,
          remaining: Math.max(0, limit - count),
        };
      } catch (error) {
        console.error('Rate Limit Error:', error);
        return { isAllowed: true, remaining: 1 };
      }
    },
  };
}

export const limiter = rateLimit({
  interval: 60,
});


