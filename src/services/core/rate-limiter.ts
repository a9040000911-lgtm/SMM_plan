/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Phase 9 Unified Rate Limiting
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
// import { prisma } from "@/lib/prisma"; // Removed for Edge compatibility
import type { NextRequest } from "next/server";

// Cache for dynamic limits from DB
const limitCache = new Map<string, { value: number; expiresAt: number }>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Fetches or returns cached limit from GlobalSettings
 */
export async function getDynamicLimit(key: string, defaultValue: number): Promise<number> {
    const cached = limitCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
    }

    try {
        let val: string | null | undefined;
        
        // --- EDGE COMPATIBILITY ---
        // If we are in Edge (Middleware), we must use internal API instead of Direct Prisma
        const isEdge = process.env.NEXT_RUNTIME === 'edge';
        
        if (isEdge) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
            const res = await fetch(`${baseUrl}/api/internal/global-settings?key=${key}`);
            if (res.ok) {
                const data = await res.json();
                val = data.value;
            }
        } else {
            // Standard Node runtime - can use Prisma
            const { prisma } = await import("@/lib/prisma");
            const settings = await prisma.globalSetting.findMany({
                where: { key: { in: [key] } }
            });
            val = settings.find(s => s.key === key)?.value;
        }

        const result = val ? parseInt(val) : defaultValue;
        
        limitCache.set(key, { value: result, expiresAt: Date.now() + CACHE_TTL });
        return result;
    } catch (_e) {
        console.error(`[RateLimiter] getDynamicLimit error for ${key}:`, _e);
        return defaultValue;
    }
}

/**
 * Get client IP from headers
 */
export function getRealIp(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0] || 
           req.headers.get('x-real-ip') || 
           (req as any).ip || 
           '127.0.0.1';
}

// Initialize Upstash Redis if configured
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

/**
 * Check rate limit using Upstash (prod) or Mock (dev/local)
 */
export async function checkRateLimit(type: 'auth' | 'api' | 'public', ip: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    // 1. Get dynamic limits based on type
    const limitCount = await getDynamicLimit(`LIMIT_${type.toUpperCase()}`, type === 'auth' ? 5 : (type === 'api' ? 60 : 100));
    
    // 2. If Redis is configured, use Upstash Ratelimit
    if (redis) {
        const ratelimit = new Ratelimit({
            redis: redis,
            limiter: Ratelimit.slidingWindow(limitCount, "1 m"),
            analytics: true,
            prefix: `ratelimit:${type}`,
        });

        const { success, limit, remaining, reset } = await ratelimit.limit(ip);
        return { success, limit, remaining, reset };
    }

    // 3. Fallback: Fail-Closed in production, Fail-Open only in development
    if (process.env.NODE_ENV === 'production') {
        console.error(`[SECURITY] Rate limiter has NO Redis backend in PRODUCTION! Blocking request from ${ip} as Fail-Closed precaution.`);
        return {
            success: false,
            limit: limitCount,
            remaining: 0,
            reset: Date.now() + 60000
        };
    }

    // Development only: allow all requests without Redis
    const now = Date.now();
    const mockReset = now + 60000;
    
    return {
        success: true,
        limit: limitCount,
        remaining: limitCount,
        reset: mockReset
    };
}


