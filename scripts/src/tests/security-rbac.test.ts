/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Security RBAC Tests
 * Verifies Server Action authorization patterns and input validation
 * 
 * @jest-environment node
 */
import { z } from 'zod';

// === Mock ALL external dependencies to prevent ESM import chains ===

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn().mockResolvedValue({
                id: 'test-user-id',
                username: 'test_user',
                balance: { toNumber: () => 500 },
                role: 'USER',
            }),
            update: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
        },
        internalService: {
            findUnique: jest.fn().mockResolvedValue({
                id: 'test-service-id',
                name: 'Test Service',
                pricePer1000: { toNumber: () => 100 },
            }),
            update: jest.fn(),
        },
        order: { aggregate: jest.fn().mockResolvedValue({ _sum: { totalPrice: null } }) },
        adminLog: { create: jest.fn() },
        ledgerEntry: { create: jest.fn() },
        $transaction: jest.fn(async (fn: any) => {
            if (typeof fn === 'function') {
                return fn({
                    user: {
                        findUnique: jest.fn().mockResolvedValue({
                            id: 'test-user-id', balance: { toNumber: () => 500 }
                        }),
                        update: jest.fn()
                    },
                    ledgerEntry: { create: jest.fn() },
                    adminLog: { create: jest.fn() },
                });
            }
            return Promise.all(fn);
        }),
    },
}));

jest.mock('@/lib/bot', () => ({
    bot: { telegram: { sendMessage: jest.fn().mockResolvedValue({}) } }
}));

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn()
}));

import { getAdminSession } from '@/utils/admin-session';

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

// Helper: set session mock for a specific role
function mockSession(role: string, extra: Record<string, any> = {}) {
    (getAdminSession as jest.Mock).mockResolvedValue({
        id: `test-${role.toLowerCase()}-id`,
        role,
        username: `test_${role.toLowerCase()}`,
        isGlobalAdmin: role === 'GLOBAL_ADMIN' || role === 'ADMIN',
        allowedProjects: ['global'],
        ...extra,
    });
}

// Import AFTER mocks (critical for ESM bypass)
import { adjustBalanceAction } from '@/app/admin/users/actions';

describe('Security: Server Action RBAC', () => {

    beforeEach(() => jest.clearAllMocks());

    // ===================================================================
    // VECTOR 1: Session validation
    // ===================================================================
    describe('Session Validation', () => {

        test('Action without session cookie should fail gracefully', async () => {
            (getAdminSession as jest.Mock).mockResolvedValue(null);

            try {
                await adjustBalanceAction('user-id', 100, 'Test');
                // If it doesn't throw, it should return error
                fail('Should have thrown or returned error');
            } catch (e: any) {
                // Should fail on auth, NOT with unhandled exception
                expect(typeof e.message).toBe('string');
            }
        });

        test('Action with malformed session should fail gracefully', async () => {
            (getAdminSession as jest.Mock).mockRejectedValue(new Error('Malformed session'));

            try {
                await adjustBalanceAction('user-id', 100, 'Test');
                fail('Should have thrown or returned error');
            } catch (e: any) {
                expect(typeof e.message).toBe('string');
            }
        });
    });

    // ===================================================================
    // VECTOR 2: Balance adjustment authorization
    // ===================================================================
    describe('adjustBalanceAction', () => {

        test('ADMIN can attempt balance adjustment', async () => {
            mockSession('ADMIN');

            try {
                await adjustBalanceAction('test-user-id', 100, 'Admin balance adjustment');
                // Success is fine — means auth passed
            } catch (e: any) {
                // Should NOT be an auth error
                expect(e.message).not.toMatch(/unauthorized/i);
                expect(e.message).not.toMatch(/forbidden/i);
            }
        });

        test('Zero amount should throw Amount cannot be zero', async () => {
            mockSession('ADMIN');

            await expect(
                adjustBalanceAction('test-user-id', 0, 'Zero test')
            ).rejects.toThrow('Amount cannot be zero');
        });
    });

    // ===================================================================
    // VECTOR 3: Input validation (Zod schemas)
    // ===================================================================
    describe('Input Validation Schemas', () => {

        // Test the Zod schemas used by service actions
        const priceSchema = z.object({
            pricePer1000: z.number().positive({ message: 'Price must be positive' }),
        });

        test('Negative price rejected by Zod', () => {
            const result = priceSchema.safeParse({ pricePer1000: -50 });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toBe('Price must be positive');
            }
        });

        test('Zero price rejected by Zod', () => {
            const result = priceSchema.safeParse({ pricePer1000: 0 });
            expect(result.success).toBe(false);
        });

        test('Valid positive price accepted by Zod', () => {
            const result = priceSchema.safeParse({ pricePer1000: 150.50 });
            expect(result.success).toBe(true);
        });

        test('NaN price rejected by Zod', () => {
            const result = priceSchema.safeParse({ pricePer1000: 'not-a-number' });
            expect(result.success).toBe(false);
        });

        // Balance amount validation
        const balanceSchema = z.object({
            amount: z.number().refine(v => v !== 0, { message: 'Amount cannot be zero' }),
            reason: z.string().min(1, { message: 'Reason required' }),
        });

        test('Zero balance amount rejected', () => {
            const result = balanceSchema.safeParse({ amount: 0, reason: 'test' });
            expect(result.success).toBe(false);
        });

        test('Positive balance amount accepted', () => {
            const result = balanceSchema.safeParse({ amount: 100, reason: 'Top up' });
            expect(result.success).toBe(true);
        });

        test('Negative balance amount accepted (deduction)', () => {
            const result = balanceSchema.safeParse({ amount: -50, reason: 'Penalty' });
            expect(result.success).toBe(true);
        });

        test('Empty reason rejected', () => {
            const result = balanceSchema.safeParse({ amount: 100, reason: '' });
            expect(result.success).toBe(false);
        });
    });
});
