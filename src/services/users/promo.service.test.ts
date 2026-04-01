/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * PromoService — Unit Tests
 */
jest.mock('@/lib/prisma', () => ({
    prisma: {
        promoCode: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
        userPromo: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    },
}));
jest.mock('@/lib/logger', () => ({ createLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }) }));

import { PromoService } from './promo.service';
import { prisma } from '@/lib/prisma';

describe('PromoService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('validatePromo', () => {
        it('returns invalid for empty code', async () => {
            const result = await PromoService.validatePromo('', 'user1');
            expect(result.valid).toBe(false);
        });

        it('returns invalid if promo not found', async () => {
            (prisma.promoCode.findFirst as jest.Mock).mockResolvedValue(null);
            const result = await PromoService.validatePromo('NOTEXIST', 'user1');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('не найден');
        });

        it('returns valid for a good promo code', async () => {
            (prisma.promoCode.findFirst as jest.Mock).mockResolvedValue({
                id: 'p1', code: 'GOODCODE', isActive: true, discountPercent: 15, projectId: null
            });
            (prisma.userPromo.findUnique as jest.Mock).mockResolvedValue(null);
            const result = await PromoService.validatePromo('GOODCODE', 'user1');
            expect(result.valid).toBe(true);
            expect(result.promo?.discountPercent).toBe(15);
        });

        it('returns invalid if user used it', async () => {
            (prisma.promoCode.findFirst as jest.Mock).mockResolvedValue({ id: 'p1', code: 'GOODCODE', isActive: true });
            (prisma.userPromo.findUnique as jest.Mock).mockResolvedValue({ usedAt: new Date() });
            const result = await PromoService.validatePromo('GOODCODE', 'user1');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Уже использован');
        });
    });
});
