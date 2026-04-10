/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 *
 * Enterprise Rate Limiter (V-05/V-06 audit fix)
 * - Edge Runtime: in-memory sliding window (not a no-op)
 * - Node.js: Redis-backed counter
 * - Fail-CLOSED on errors (reject on uncertainty)
 */

export interface RateLimitOptions {
  interval: number; // Interval in seconds
}

// ── In-Memory Rate Limiter for Edge Runtime ──────────────────────────
// Simple sliding window using a Map. Entries auto-expire via TTL check.
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function checkInMemory(key: string, limit: number, intervalMs: number): { isAllowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = inMemoryStore.get(key);

    if (!entry || now >= entry.resetAt) {
        // New window
        inMemoryStore.set(key, { count: 1, resetAt: now + intervalMs });
        return { isAllowed: true, remaining: limit - 1 };
    }

    entry.count++;
    if (entry.count > limit) {
        return { isAllowed: false, remaining: 0 };
    }

    return { isAllowed: true, remaining: limit - entry.count };
}

// Periodic cleanup to prevent memory leak (every 60s, remove expired entries)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of inMemoryStore) {
            if (now >= entry.resetAt) {
                inMemoryStore.delete(key);
            }
        }
    }, 60_000);
}

// ── Main Rate Limiter ────────────────────────────────────────────────
export function rateLimit(options: RateLimitOptions) {
  const intervalMs = options.interval * 1000;

  return {
    check: async (limit: number, token: string) => {
      const key = `ratelimit:${token}`;
      const isEdge = process.env.NEXT_RUNTIME === 'edge';

      if (isEdge) {
        // V-05 FIX: Real in-memory rate limiting instead of always-allow
        return checkInMemory(key, limit, intervalMs);
      }

      try {
        // Dynamic import for Node.js only
        const { redis } = await import('../lib/redis');

        if (!redis) {
          // V-06 FIX: Fail-closed when Redis is unavailable
          console.warn('[RateLimit] Redis unavailable — fail-closed');
          return { isAllowed: false, remaining: 0 };
        }

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
        // V-06 FIX: Fail-closed — deny on Redis errors
        console.error('[RateLimit] Redis error — fail-closed:', error);
        return { isAllowed: false, remaining: 0 };
      }
    },
  };
}

export const limiter = rateLimit({
  interval: 60,
});
