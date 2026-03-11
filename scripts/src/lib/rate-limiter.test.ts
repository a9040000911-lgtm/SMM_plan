/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
// 1. SET ENV VARS BEFORE ANYTHING ELSE
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

// 3. MOCK PRISMA
jest.mock('./prisma', () => ({
    prisma: {
        globalSetting: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        }
    }
}));

// 4. MOCK SESSION
jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn()
}));

// 5. INJECT REDIS MOCK INTO THE MODULE EXPORT IF NEEDED. 
// Since we import *after* setting env, the module's top-level Redis init should call our mock implementation.
import * as rateLimiterModule from './rate-limiter';
(rateLimiterModule as any).redis = mockRedis;


describe('Dynamic Rate Limiter', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDynamicLimit', () => {
        test('should fetch from DB if not in cache', async () => {
            (mockRedis.get as jest.Mock).mockResolvedValue(null);
            (prisma.globalSetting.findFirst as jest.Mock).mockResolvedValue({
                key: 'RATE_LIMIT_PUBLIC',
                value: '50'
            });

            const limit = await getDynamicLimit('RATE_LIMIT_PUBLIC', 100);

            expect(limit).toBe(50);
            expect(prisma.globalSetting.findFirst).toHaveBeenCalledWith({
                where: { key: 'RATE_LIMIT_PUBLIC' }
            });
            expect(mockRedis.set).toHaveBeenCalled();
        });

        test('should use default value if DB record is missing', async () => {
            (mockRedis.get as jest.Mock).mockResolvedValue(null);
            (prisma.globalSetting.findFirst as jest.Mock).mockResolvedValue(null);

            const limit = await getDynamicLimit('NON_EXISTENT', 77);
            expect(limit).toBe(77);
        });

        test('should use cache if available', async () => {
            (mockRedis.get as jest.Mock).mockResolvedValue('30');

            const limit = await getDynamicLimit('RATE_LIMIT_PUBLIC', 100);

            expect(limit).toBe(30);
            expect(prisma.globalSetting.findFirst).not.toHaveBeenCalled();
        });
    });

    describe('Global Admin Bypass', () => {
        test('checkRateLimit should return success:true for Global Admins immediately', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue({
                isGlobalAdmin: true,
                role: 'ADMIN'
            });

            const result = await checkRateLimit('public', 'ANY_KEY');
            expect(result.success).toBe(true);
            expect(mockRedis.get).not.toHaveBeenCalled();
        });

        test('checkRateLimit should proceed with limiting for regular users', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue(null); // Guest
            (mockRedis.get as jest.Mock).mockResolvedValue('5'); // current count
            mockRedis.incr.mockResolvedValue(6);

            // Mock dynamic limit to 10
            (prisma.globalSetting.findFirst as jest.Mock).mockResolvedValue({
                key: 'RATE_LIMIT_PUBLIC',
                value: '10'
            });

            const result = await checkRateLimit('public', 'user-123');
            expect(result.success).toBe(true);
            expect(mockRedis.incr).toHaveBeenCalled();
        });
    });
});
