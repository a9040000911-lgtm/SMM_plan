/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * OrderSyncService — Unit Tests
 */

jest.mock('@/lib/prisma', () => ({
    prisma: {
        order: { findMany: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
        provider: { findFirst: jest.fn() },
        providerService: { findUnique: jest.fn() },
        internalServiceMapping: { findMany: jest.fn() },
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    },
}));

jest.mock('@/services/providers/provider.service', () => ({
    ProviderService: {
        getOrderStatus: jest.fn(),
        getStatuses: jest.fn(),
        createOrder: jest.fn(),
    },
}));

jest.mock('@/services/orders/order-refund.service', () => ({
    OrderRefundService: {
        handleRefund: jest.fn(),
    },
}));

jest.mock('@/lib/logger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }),
}));

jest.mock('@/services/core/config.service', () => ({
    ConfigService: { getTelegramConfig: jest.fn().mockResolvedValue({}) },
}));
jest.mock('@/bot/utils/notification-templates', () => ({
    NotificationTemplates: { ORDER: { REFILL_SUCCESS_ADMIN: jest.fn().mockReturnValue('msg') } },
}));
jest.mock('@/services/bot/bot-registry', () => ({
    bot: { telegram: { sendMessage: jest.fn().mockResolvedValue({}) } },
}));

import { OrderSyncService } from './order-sync.service';
import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers/provider.service';
import { Decimal } from 'decimal.js';

describe('OrderSyncService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('mapStatus (private)', () => {
        const mapStatus = (OrderSyncService as any).mapStatus.bind(OrderSyncService);

        it('maps completed statuses', () => {
            expect(mapStatus('completed')).toBe('COMPLETED');
            expect(mapStatus('Finished')).toBe('COMPLETED');
        });

        it('maps in-progress statuses', () => {
            expect(mapStatus('in progress')).toBe('IN_PROGRESS');
        });

        it('maps partial statuses', () => {
            expect(mapStatus('partial')).toBe('PARTIAL');
            expect(mapStatus('partially_completed')).toBe('PARTIAL');
        });

        it('maps canceled statuses', () => {
            expect(mapStatus('canceled')).toBe('CANCELED');
            expect(mapStatus('error')).toBe('CANCELED');
        });

        it('returns null for unknown', () => {
            expect(mapStatus('unknown_status')).toBeNull();
        });
    });

    describe('syncAllActive', () => {
        it('exits early if no active orders found', async () => {
            (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
            await OrderSyncService.syncAllActive();
            expect(ProviderService.getStatuses).not.toHaveBeenCalled();
        });
    });

    describe('syncSingleOrder', () => {
        const mockOrder = { id: 1, status: 'PROCESSING', externalId: 'ext-1', remains: 100, user: { id: 'u1' } };

        it('handles provider error responses', async () => {
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({ error: 'Provider down' });
            await OrderSyncService.syncSingleOrder(mockOrder);
            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { providerRawResponse: { error: 'Provider down' } }
            });
        });

        it('updates order to COMPLETED with cost price', async () => {
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({
                status: 'Completed', remains: 0, cost: 0.55
            });
            await OrderSyncService.syncSingleOrder(mockOrder);
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 },
                    data: expect.objectContaining({
                        status: 'COMPLETED',
                        remains: 0,
                        costPrice: new Decimal(0.55)
                    })
                })
            );
        });

        it('does not crash on provider exceptions', async () => {
            (ProviderService.getOrderStatus as jest.Mock).mockRejectedValue(new Error('Network'));
            await expect(OrderSyncService.syncSingleOrder(mockOrder)).resolves.not.toThrow();
        });
    });
});
