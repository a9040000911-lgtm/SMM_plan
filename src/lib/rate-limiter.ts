/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { prisma } from './prisma';

// --- UPSTASH CONFIGURATION ---
// Upstash Ratelimit STRICTLY requires UPSTASH_REDIS_REST_URL (https://)
// Generic redis:// URLs will not work and cause 5-second TCP connection deadlocks.
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.replace(/^"/, '').replace(/"$/, '') || null;
const isUpstashConfigured = UPSTASH_URL?.startsWith('https://');

const redis = isUpstashConfigured ? new Redis({
    url: UPSTASH_URL as string,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null as any;

// --- DYNAMIC LIMITS CACHE ---
let settingsCache: Record<string, number> = {};
let lastCacheUpdate = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function getDynamicLimit(key: string, defaultValue: number): Promise<number> {
    const now = Date.now();
    if (now - lastCacheUpdate > CACHE_TTL) {
        try {
            const settings = await prisma.globalSetting.findMany({
                where: { key: { in: ['LIMIT_AUTH', 'LIMIT_API', 'LIMIT_PUBLIC'] } }
            });
            settingsCache = {};
            settings.forEach(s => {
                const val = parseInt(s.value);
                if (!isNaN(val)) settingsCache[s.key] = val;
            });
            lastCacheUpdate = now;
        } catch (e) {
            console.error('[RateLimiter] Error fetching dynamic limits:', e);
        }
    }
    return settingsCache[key] ?? defaultValue;
}

// --- MOCK RATELIMITER FOR LOCAL/DEV OR MISSING KEYS ---
// Uses in-memory map to provide basic protection and pass security audits in dev mode.
const devCache = new Map<string, { count: number; lastReset: number }>();

class MockRatelimit {
    private limitValue: number;
    private windowMs: number;

    constructor(limit: number = 10, windowMinutes: number = 1) {
        this.limitValue = limit;
        this.windowMs = windowMinutes * 60 * 1000;
    }

    async limit(identifier: string) {
        const now = Date.now();
        const state = devCache.get(identifier) || { count: 0, lastReset: now };

        if (now - state.lastReset > this.windowMs) {
            state.count = 0;
            state.lastReset = now;
        }

        state.count++;
        devCache.set(identifier, state);

        const success = state.count <= this.limitValue;
        return {
            success,
            limit: this.limitValue,
            remaining: Math.max(0, this.limitValue - state.count),
            reset: state.lastReset + this.windowMs
        };
    }
}

/**
 * Helper to check rate limit with dynamic values
 */
export async function checkRateLimit(
    type: 'auth' | 'api' | 'public',
    identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    let limitValue = 10;
    let limiter: any;

    if (type === 'auth') {
        limitValue = await getDynamicLimit('LIMIT_AUTH', 60);
        limiter = authLimiter;
    } else if (type === 'api') {
        limitValue = await getDynamicLimit('LIMIT_API', 150);
        limiter = apiLimiter;
    } else {
        limitValue = await getDynamicLimit('LIMIT_PUBLIC', 300);
        limiter = publicLimiter;
    }

    // Update limit for MockRatelimit if active
    if (limiter instanceof MockRatelimit) {
        (limiter as any).limitValue = limitValue;
    }

    return limiter.limit(identifier);
}

/**
 * Strict limiter for Authentication and high-risk endpoints.
 * Protects against brute-force and credential stuffing.
 * Default Limit: 60 requests per 1 minute per IP.
 */
export const authLimiter = isUpstashConfigured ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: process.env.UPSTASH_REDIS_REST_URL ? true : false,
    prefix: '@upstash/ratelimit:auth',
}) : new MockRatelimit(60, 1);

/**
 * Standard API limiter for catalog browsing and general endpoint usage.
 * Protects against aggressive scraping and bot activity.
 * Limit: 50 requests per 1 minute per IP.
 */
export const apiLimiter = isUpstashConfigured ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(150, '1 m'),
    analytics: process.env.UPSTASH_REDIS_REST_URL ? true : false,
    prefix: '@upstash/ratelimit:api',
}) : new MockRatelimit(150, 1);

/**
 * General public route limiter.
 * Protects against basic flooding of the frontend pages.
 * Limit: 100 requests per 1 minute per IP.
 */
export const publicLimiter = isUpstashConfigured ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'),
    analytics: process.env.UPSTASH_REDIS_REST_URL ? true : false,
    prefix: '@upstash/ratelimit:public',
}) : new MockRatelimit(300, 1);

/**
 * Helper to extract IP from common proxy headers (like Cloudflare)
 */
export function getRealIp(request: Request): string {
    const fallback = '127.0.0.1';

    // Cloudflare specific connecting IP
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;

    // Standard forwarded-for
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // Next.js generic IP (if available in edge runtime)
    return request.headers.get('x-real-ip') || fallback;
}
