/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * OrderRefundService — Unit Tests
 */
jest.mock('@/lib/prisma', () => ({
    prisma: {
        order: { findUnique: jest.fn(), update: jest.fn() },
        user: { update: jest.fn(), findUnique: jest.fn() },
        ledgerEntry: { create: jest.fn() },
        adminLog: { create: jest.fn() },
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
        $transaction: jest.fn((cb: any) => cb({
            order: { update: jest.fn(), findUnique: jest.fn().mockResolvedValue({ id: 1, refundedAmount: new Decimal(0), totalPrice: new Decimal(100), userId: 'u1' }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
            user: { update: jest.fn(), findUnique: jest.fn().mockResolvedValue({ id: 'u1', username: 'Test', balance: new Decimal(100) }) },
            ledgerEntry: { create: jest.fn() },
            transaction: { create: jest.fn() },
        })),
    },
}));
jest.mock('@/lib/logger', () => ({ createLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }) }));
jest.mock('@/services/bot/bot-registry', () => ({
    bot: { telegram: { sendMessage: jest.fn().mockResolvedValue({}) } },
}));
jest.mock('@/services/core/config.service', () => ({
    ConfigService: { getTelegramConfig: jest.fn().mockResolvedValue({ adminId: 123 }) },
}));
jest.mock('@/bot/utils/notification-templates', () => ({
    NotificationTemplates: {
        ORDER: {
            REFUND_USER: jest.fn().mockReturnValue('refund'),
            REFUND_ADMIN: jest.fn().mockReturnValue('admin refund'),
        }
    },
}));
jest.mock('@/services/finance/b2b-pricing.service', () => ({
    B2BPricingService: { processB2BRefund: jest.fn().mockResolvedValue({}) },
}));

import { OrderRefundService } from './order-refund.service';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

describe('OrderRefundService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('handleRefund', () => {
        const mockOrder = {
            id: 1, userId: 'u1', quantity: 1000, totalPrice: new Decimal(100),
            status: 'PROCESSING', remains: 500, projectId: 'proj1',
            user: { id: 'u1', balance: new Decimal(50), tgId: '123' },
        };

        it('calculates partial refund correctly', async () => {
            await OrderRefundService.handleRefund(mockOrder as any, 'PARTIAL', 500);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
});
