/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Synchronized with Phase 9 Unified Rate Limiting
 */

// 1. SET ENV VARS
process.env.UPSTASH_REDIS_REST_URL = 'https://mock.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

import { checkRateLimit, getDynamicLimit } from './rate-limiter';
import { prisma } from './prisma';
import { getAdminSession } from '@/utils/admin-session';

// 2. MOCK REDIS
const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
    Redis: jest.fn().mockImplementation(() => mockRedis)
}));

// 3. MOCK RATELIMIT (Upstash)
jest.mock('@upstash/ratelimit', () => ({
    Ratelimit: {
        slidingWindow: jest.fn(),
    }
}));

// 4. MOCK PRISMA
jest.mock('./prisma', () => ({
    prisma: {
        globalSetting: {
            findMany: jest.fn(),
        }
    }
}));

// 5. MOCK SESSION
jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn()
}));

describe('Dynamic Rate Limiter (Phase 9)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDynamicLimit', () => {
        it('should fetch from DB if not in cache', async () => {
            (prisma.globalSetting.findMany as jest.Mock).mockResolvedValue([{
                key: 'LIMIT_PUBLIC',
                value: '50'
            }]);

            // We test the logic assuming cache is empty at start
            const limit = await getDynamicLimit('LIMIT_PUBLIC', 100);

            expect(limit).toBe(50);
            expect(prisma.globalSetting.findMany).toHaveBeenCalled();
        });

        it('should use default value if DB record is missing', async () => {
            (prisma.globalSetting.findMany as jest.Mock).mockResolvedValue([]);

            const limit = await getDynamicLimit('NON_EXISTENT', 77);
            expect(limit).toBe(77);
        });
    });

    describe('checkRateLimit', () => {
        it('should return success:true for Global Admins bypassing checks', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: true,
                role: 'ADMIN'
            });

            const result = await checkRateLimit('public', 'admin-id');
            expect(result.success).toBe(true);
        });

        it('should use MockRatelimit if Upstash is not fully configured or in dev', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue(null);
            
            // Trigger check for a regular user
            const result = await checkRateLimit('public', 'user-1');
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('remaining');
        });
    });
});
