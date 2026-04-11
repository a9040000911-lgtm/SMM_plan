/**
 * @jest-environment node
 */
import { ScheduledOrderService } from './scheduled-order.service';
import { prisma } from '@/lib/prisma';
import { OrderActivationService } from './order-activation.service';
import { BotRegistry } from '@/services/bot/bot-registry';
import { Decimal } from 'decimal.js';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        scheduledOrder: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(prisma)),
    },
}));

jest.mock('./order-activation.service', () => ({
    OrderActivationService: {
        initiateOrder: jest.fn(),
    },
}));

jest.mock('@/services/bot/bot-registry', () => ({
    BotRegistry: {
        get: jest.fn(() => ({
            telegram: {
                sendMessage: jest.fn().mockResolvedValue({}),
            },
        })),
    },
}));

describe('ScheduledOrderService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('processPendingScheduledOrders', () => {
        test('should return early if no pending orders', async () => {
            (prisma.scheduledOrder.findMany as jest.Mock).mockResolvedValue([]);
            await ScheduledOrderService.processPendingScheduledOrders();
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        test('should process multiple pending orders', async () => {
            (prisma.scheduledOrder.findMany as jest.Mock).mockResolvedValue([
                { id: '1' }, { id: '2' }
            ]);
            
            const executeSpy = jest.spyOn(ScheduledOrderService, 'executeScheduledOrder').mockResolvedValue({} as any);
            
            await ScheduledOrderService.processPendingScheduledOrders();
            
            expect(executeSpy).toHaveBeenCalledTimes(2);
            executeSpy.mockRestore();
        });

        test('should handle errors in individual orders without stopping', async () => {
            (prisma.scheduledOrder.findMany as jest.Mock).mockResolvedValue([
                { id: 'err' }, { id: 'ok' }
            ]);
            
            const executeSpy = jest.spyOn(ScheduledOrderService, 'executeScheduledOrder')
                .mockRejectedValueOnce(new Error('Fatal'))
                .mockResolvedValueOnce({} as any);
            
            await ScheduledOrderService.processPendingScheduledOrders();
            
            expect(executeSpy).toHaveBeenCalledTimes(2);
            executeSpy.mockRestore();
        });
    });

    describe('executeScheduledOrder', () => {
        const mockScheduled = {
            id: 's1',
            status: 'PENDING',
            userId: 'u1',
            projectId: 'p1',
            serviceId: 'svc1',
            link: 'link1',
            quantity: 100,
            totalPrice: new Decimal(10),
            scheduleTime: new Date(),
            user: { balance: new Decimal(100) }
        };

        test('should skip if order not found or not pending', async () => {
            (prisma.scheduledOrder.findUnique as jest.Mock).mockResolvedValue(null);
            await ScheduledOrderService.executeScheduledOrder('s1');
            expect(OrderActivationService.initiateOrder).not.toHaveBeenCalled();
        });

        test('should fail if insufficient balance', async () => {
            const lowBalanceScheduled = { ...mockScheduled, user: { balance: new Decimal(1) } };
            (prisma.scheduledOrder.findUnique as jest.Mock).mockResolvedValue(lowBalanceScheduled);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ tgId: 12345n });

            await ScheduledOrderService.executeScheduledOrder('s1');

            expect(prisma.scheduledOrder.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: 'CANCELED' }
            }));
            expect(BotRegistry.get).toHaveBeenCalled();
            expect(OrderActivationService.initiateOrder).not.toHaveBeenCalled();
        });

        test('should successfully execute and complete order', async () => {
            (prisma.scheduledOrder.findUnique as jest.Mock).mockResolvedValue(mockScheduled);
            (OrderActivationService.initiateOrder as jest.Mock).mockResolvedValue({ id: 'real_1' });

            await ScheduledOrderService.executeScheduledOrder('s1');

            expect(OrderActivationService.initiateOrder).toHaveBeenCalled();
            expect(prisma.scheduledOrder.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: 'COMPLETED' }
            }));
        });

        test('should handle null totalPrice', async () => {
            const noPriceScheduled = { ...mockScheduled, totalPrice: null };
            (prisma.scheduledOrder.findUnique as jest.Mock).mockResolvedValue(noPriceScheduled);
            (OrderActivationService.initiateOrder as jest.Mock).mockResolvedValue({ id: 'real_2' });

            await ScheduledOrderService.executeScheduledOrder('s2');

            expect(OrderActivationService.initiateOrder).toHaveBeenCalledWith(
                expect.objectContaining({ totalPrice: expect.any(Object) }),
                expect.any(Object)
            );
        });

        test('should handle recurrence', async () => {
            const recurringScheduled = { ...mockScheduled, repeatInterval: 60 }; // Every hour
            (prisma.scheduledOrder.findUnique as jest.Mock).mockResolvedValue(recurringScheduled);
            (OrderActivationService.initiateOrder as jest.Mock).mockResolvedValue({ id: 'real_1' });

            await ScheduledOrderService.executeScheduledOrder('s1');

            expect(prisma.scheduledOrder.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'PENDING',
                    repeatInterval: 60
                })
            }));
        });

        test('should handle execution error and notify user', async () => {
            (prisma.scheduledOrder.findUnique as jest.Mock).mockResolvedValue(mockScheduled);
            (OrderActivationService.initiateOrder as jest.Mock).mockRejectedValue(new Error('Provider down'));
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ tgId: 12345n });

            await expect(ScheduledOrderService.executeScheduledOrder('s1')).rejects.toThrow('Provider down');

            expect(prisma.scheduledOrder.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: 'CANCELED' }
            }));
            expect(BotRegistry.get).toHaveBeenCalled();
        });
    });

    describe('forceRun', () => {
        test('should delegate to executeScheduledOrder', async () => {
            const spy = jest.spyOn(ScheduledOrderService, 'executeScheduledOrder').mockResolvedValue({} as any);
            await ScheduledOrderService.forceRun('s1');
            expect(spy).toHaveBeenCalledWith('s1');
            spy.mockRestore();
        });
    });
});
