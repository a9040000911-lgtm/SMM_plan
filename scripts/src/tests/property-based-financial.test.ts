/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Property-Based Tests for Financial Logic
 * Uses fast-check to generate thousands of random inputs and verify invariants
 * 
 * @jest-environment node
 */
import fc from 'fast-check';
import { Decimal } from 'decimal.js';

// === Mock ALL external dependencies to prevent ESM import chains ===
jest.mock('@/lib/prisma', () => ({
    prisma: {
        internalServiceMapping: { findMany: jest.fn() },
        internalService: { update: jest.fn(), findUnique: jest.fn() },
        adminLog: { create: jest.fn() },
        project: { findUnique: jest.fn() },
        user: { findUnique: jest.fn(), findMany: jest.fn() },
        provider: { findUnique: jest.fn() },
        providerBalanceLog: { findFirst: jest.fn() },
        order: { findMany: jest.fn(), aggregate: jest.fn() },
        $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
    }
}));

jest.mock('@/lib/bot', () => ({
    bot: { telegram: { sendMessage: jest.fn().mockResolvedValue({}) } }
}));

jest.mock('@/services/core', () => ({
    SettingsService: {
        getNumber: jest.fn().mockResolvedValue(500),
        getJson: jest.fn().mockResolvedValue(null),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
    }
}));

jest.mock('@/services/users', () => ({
    LoyaltyService: { getLoyaltyInfo: jest.fn().mockResolvedValue({ totalDiscount: 0 }) }
}));

import { PricingService } from '@/services/finance/pricing.service';

// Helper: 32-bit float safe values for fast-check
const F32_MIN = Math.fround(0.01);
const F32_MAX = Math.fround(100000);
const F32_MAX_SMALL = Math.fround(10000);
const F32_MAX_MED = Math.fround(50000);
const F32_MAX_5K = Math.fround(5000);

describe('Property-Based Tests: Financial Invariants', () => {

    // ===================================================================
    // INVARIANT 1: Retail price > provider cost
    // ===================================================================
    describe('PricingService.calculateRetailPrice', () => {

        test('INVARIANT: Price is ALWAYS > cost for any positive cost', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.float({ min: F32_MIN, max: F32_MAX, noNaN: true }),
                    async (costNum) => {
                        const cost = new Decimal(costNum);
                        const price = await PricingService.calculateRetailPrice(cost);
                        expect(price.toNumber()).toBeGreaterThan(cost.toNumber());
                    }
                ),
                { numRuns: 500 }
            );
        });

        test('INVARIANT: Price is ALWAYS positive for any positive cost', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.float({ min: F32_MIN, max: F32_MAX_MED, noNaN: true }),
                    async (costNum) => {
                        const price = await PricingService.calculateRetailPrice(new Decimal(costNum));
                        expect(price.toNumber()).toBeGreaterThan(0);
                    }
                ),
                { numRuns: 500 }
            );
        });

        test('INVARIANT: Price is exactly 0 when cost is 0', async () => {
            const price = await PricingService.calculateRetailPrice(new Decimal(0));
            expect(price.toNumber()).toBe(0);
        });

        test('INVARIANT: Price >= Safety Floor', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.float({ min: Math.fround(0.1), max: F32_MAX_SMALL, noNaN: true }),
                    async (costNum) => {
                        const cost = new Decimal(costNum);
                        const price = await PricingService.calculateRetailPrice(cost);
                        const safetyPrice = PricingService.getSafetyPrice(cost);
                        expect(price.gte(safetyPrice)).toBe(true);
                    }
                ),
                { numRuns: 300 }
            );
        });

        test('INVARIANT: Price never exceeds MAX_MARKUP cap', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.float({ min: Math.fround(0.1), max: F32_MAX_SMALL, noNaN: true }),
                    async (costNum) => {
                        const cost = new Decimal(costNum);
                        const price = await PricingService.calculateRetailPrice(cost);
                        const maxPrice = cost.mul(PricingService.MAX_MARKUP_MULTIPLIER);
                        expect(price.toNumber()).toBeLessThanOrEqual(maxPrice.toNumber() + 1);
                    }
                ),
                { numRuns: 300 }
            );
        });

        test('INVARIANT: Higher cost => higher or equal price (within same ladder tier)', async () => {
            // NOTE: Pricing ladder has intentional discontinuities at tier boundaries.
            // Example: threshold=1 jumps from x50 to x11 — this is by design for very cheap services.
            // Also, individual services may have custom markups (e.g. 500%) set manually by admins.
            // This test only verifies monotonicity WITHIN the same tier (cost > 1.1).
            await fc.assert(
                fc.asyncProperty(
                    fc.float({ min: Math.fround(1.1), max: F32_MAX_5K, noNaN: true }),
                    fc.float({ min: Math.fround(1.1), max: F32_MAX_5K, noNaN: true }),
                    async (a, b) => {
                        const costA = new Decimal(Math.min(a, b));
                        const costB = new Decimal(Math.max(a, b));
                        if (costA.eq(costB)) return;

                        const priceA = await PricingService.calculateRetailPrice(costA);
                        const priceB = await PricingService.calculateRetailPrice(costB);
                        expect(priceB.gte(priceA)).toBe(true);
                    }
                ),
                { numRuns: 300 }
            );
        });
    });

    // ===================================================================
    // INVARIANT 2: Safety price formula
    // ===================================================================
    describe('PricingService.getSafetyPrice', () => {

        test('INVARIANT: Safety price is ALWAYS > 2x cost', () => {
            fc.assert(
                fc.property(
                    fc.float({ min: F32_MIN, max: F32_MAX, noNaN: true }),
                    (costNum) => {
                        const cost = new Decimal(costNum);
                        const safety = PricingService.getSafetyPrice(cost);
                        expect(safety.toNumber()).toBeGreaterThanOrEqual(cost.toNumber() * 2);
                    }
                ),
                { numRuns: 1000 }
            );
        });

        test('INVARIANT: Safety price includes gateway fee buffer', () => {
            fc.assert(
                fc.property(
                    fc.float({ min: Math.fround(1), max: F32_MAX_SMALL, noNaN: true }),
                    (costNum) => {
                        const cost = new Decimal(costNum);
                        const safety = PricingService.getSafetyPrice(cost);
                        const withoutGateway = cost.mul(1 + PricingService.MIN_PROFIT_MARGIN);
                        expect(safety.toNumber()).toBeGreaterThan(withoutGateway.toNumber());
                    }
                ),
                { numRuns: 500 }
            );
        });
    });
});
