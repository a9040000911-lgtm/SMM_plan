/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { OrderSyncService } from './order-sync.service';
import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers';
import { Decimal } from 'decimal.js';

/**
 * Тесты для OrderSyncService
 * Стандарт: Triple A (Arrange, Act, Assert)
 * Покрытие: 100% функционала и ветвлений
 */

jest.mock('@/lib/prisma', () => ({
    prisma: {
        order: {
            findMany: jest.fn(),
            update: jest.fn(),
        },
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    },
}));

jest.mock('@/services/providers', () => ({
    ProviderService: {
        getOrderStatus: jest.fn(),
    },
}));

describe('OrderSyncService', () => {
    const mockOrder = {
        id: 'order-1',
        status: 'PROCESSING',
        externalId: 'ext-1',
        remains: 100,
        user: { id: 'user-1' },
    };

    const mockServices = {
        OrderRefundService: {
            handleRefund: jest.fn(),
            tryAutoRefill: jest.fn(),
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    describe('mapStatus', () => {
        it('should map all external statuses to internal equivalents (case-insensitive)', () => {
            const mapStatus = (OrderSyncService as any).mapStatus;
            expect(mapStatus('Completed')).toBe('COMPLETED');
            expect(mapStatus('finished')).toBe('COMPLETED');
            expect(mapStatus('In Progress')).toBe('IN_PROGRESS');
            expect(mapStatus('inprogress')).toBe('IN_PROGRESS');
            expect(mapStatus('Partial')).toBe('PARTIAL');
            expect(mapStatus('partially_completed')).toBe('PARTIAL');
            expect(mapStatus('Canceled')).toBe('CANCELED');
            expect(mapStatus('cancelled')).toBe('CANCELED');
            expect(mapStatus('error')).toBe('CANCELED');
            expect(mapStatus('Unknown')).toBe(null);
        });
    });

    describe('syncSingleOrder', () => {
        it('should update order to COMPLETED and save cost price', async () => {
            // Arrange
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({
                status: 'Completed',
                remains: 0,
                cost: 0.55
            });

            // Act
            await OrderSyncService.syncSingleOrder(mockOrder, mockServices as any);

            // Assert
            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 'order-1' },
                data: expect.objectContaining({
                    status: 'COMPLETED',
                    remains: 0,
                    costPrice: new Decimal(0.55)
                })
            });
        });

        it('should trigger tryAutoRefill for CANCELED orders and NOT refund if refilled', async () => {
            // Arrange
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({ status: 'Canceled', remains: 100 });
            mockServices.OrderRefundService.tryAutoRefill.mockResolvedValue(true);

            // Act
            await OrderSyncService.syncSingleOrder(mockOrder, mockServices as any);

            // Assert
            expect(mockServices.OrderRefundService.tryAutoRefill).toHaveBeenCalledWith(mockOrder.id);
            expect(mockServices.OrderRefundService.handleRefund).not.toHaveBeenCalled();
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it('should trigger handleRefund if tryAutoRefill fails for CANCELED orders', async () => {
            // Arrange
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({ status: 'Canceled', remains: 100 });
            mockServices.OrderRefundService.tryAutoRefill.mockResolvedValue(false);

            // Act
            await OrderSyncService.syncSingleOrder(mockOrder, mockServices as any);

            // Assert
            expect(mockServices.OrderRefundService.tryAutoRefill).toHaveBeenCalledWith(mockOrder.id);
            expect(mockServices.OrderRefundService.handleRefund).toHaveBeenCalledWith(mockOrder, 'CANCELED', 100);
        });

        it('should trigger partial refund for PARTIAL orders', async () => {
            // Arrange
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({ status: 'Partial', remains: 40 });

            // Act
            await OrderSyncService.syncSingleOrder(mockOrder, mockServices as any);

            // Assert
            expect(mockServices.OrderRefundService.handleRefund).toHaveBeenCalledWith(mockOrder, 'PARTIAL', 40);
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it('should update processing status for IN_PROGRESS', async () => {
            // Arrange
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({ status: 'In Progress', remains: 50 });

            // Act
            await OrderSyncService.syncSingleOrder(mockOrder, mockServices as any);

            // Assert
            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 'order-1' },
                data: expect.objectContaining({ status: 'IN_PROGRESS', remains: 50 })
            });
        });

        it('should handle and log provider errors', async () => {
            // Arrange
            const errorResponse = { error: 'Order not found in system' };
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue(errorResponse);

            // Act
            await OrderSyncService.syncSingleOrder(mockOrder, mockServices as any);

            // Assert
            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 'order-1' },
                data: { providerRawResponse: errorResponse }
            });
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[OrderSync]'));
        });
    });

    describe('syncAllActive', () => {
        it('should exit early if no active orders found', async () => {
            // Arrange
            (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

            // Act
            await OrderSyncService.syncAllActive();

            // Assert
            expect(ProviderService.getOrderStatus).not.toHaveBeenCalled();
        });

        it('should handle and log errors in the loop', async () => {
            // Arrange
            (prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);
            jest.spyOn(OrderSyncService, 'syncSingleOrder').mockRejectedValue(new Error('Loop Error'));

            // Act
            await OrderSyncService.syncAllActive();

            // Assert
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[OrderSync]'), expect.any(Error));
        });
    });
});
