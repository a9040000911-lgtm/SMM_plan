/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * DripFeedService — Unit Tests
 */
jest.mock('@/lib/prisma', () => ({
    prisma: {
        order: { findUnique: jest.fn(), update: jest.fn() },
        providerService: { findFirst: jest.fn() },
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    },
}));
jest.mock('@/services/providers', () => ({
    ProviderService: { getOrderStatus: jest.fn(), createOrder: jest.fn() },
}));
jest.mock('@/services/core/queues', () => ({
    dripFeedQueue: { add: jest.fn().mockResolvedValue({}) },
}));
jest.mock('@/services/orders/order-refund.service', () => ({
    OrderRefundService: { handleRefund: jest.fn() },
}));
jest.mock('@/lib/logger', () => ({ createLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }) }));

import { DripFeedService } from './drip-feed.service';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

describe('DripFeedService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('processRun', () => {
        it('returns early if order not found', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);
            await DripFeedService.processRun(999);
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it('returns early if isDripFeed is false', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 1, isDripFeed: false, currentRun: 0, runs: 5 });
            await DripFeedService.processRun(1);
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it('returns early if all runs completed', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 1, isDripFeed: true, currentRun: 5, runs: 5 });
            await DripFeedService.processRun(1);
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it('skips if project has drip-feed disabled', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                id: 1, isDripFeed: true, currentRun: 0, runs: 5,
                project: { isDripFeedDisabled: true },
                internalService: { isDripFeedDisabled: false, providerMappings: [] }
            });
            await DripFeedService.processRun(1);
            expect(prisma.order.update).not.toHaveBeenCalled();
        });
    });

    describe('scheduleFirstRun', () => {
        it('updates order and schedules next run', async () => {
            const mockOrder = { id: 1, runs: 3, interval: 60 } as any;
            (prisma.order.update as jest.Mock).mockResolvedValue({});
            const { dripFeedQueue } = require('@/services/core/queues');

            await DripFeedService.scheduleFirstRun(mockOrder, 'ext-1', 'Provider1', { ok: true });

            expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 1 },
                data: expect.objectContaining({ currentRun: 1, status: 'PROCESSING' })
            }));
            expect(dripFeedQueue.add).toHaveBeenCalled();
        });

        it('does not schedule if only 1 run', async () => {
            const mockOrder = { id: 2, runs: 1, interval: 60 } as any;
            (prisma.order.update as jest.Mock).mockResolvedValue({});
            const { dripFeedQueue } = require('@/services/core/queues');

            await DripFeedService.scheduleFirstRun(mockOrder, 'ext-2', 'Provider2', {});

            expect(prisma.order.update).toHaveBeenCalled();
            expect(dripFeedQueue.add).not.toHaveBeenCalled();
        });
    });
});
