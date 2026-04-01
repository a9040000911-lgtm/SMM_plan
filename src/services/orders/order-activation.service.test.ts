/**
 * @jest-environment node
 */
import { OrderActivationService } from './order-activation.service';
import { prisma } from '@/lib/prisma';
import { OrderLifecycleService } from './order-lifecycle.service';
import { OrderFinancialService } from './order-financial.service';
import { BotRegistry } from '@/services/bot/bot-registry';
import { ConfigService } from '@/services/core/config.service';
import { Decimal } from 'decimal.js';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        internalService: { findUnique: jest.fn(), update: jest.fn() },
        project: { findUnique: jest.fn() },
        transaction: { create: jest.fn() },
        user: { findUnique: jest.fn() },
        $transaction: jest.fn((callback) => callback(prisma)),
    },
}));

jest.mock('./order-lifecycle.service', () => ({
    OrderLifecycleService: {
        createOrderRecord: jest.fn(),
    },
}));

jest.mock('./order-financial.service', () => ({
    OrderFinancialService: {
        chargeOrder: jest.fn(),
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
    bot: {
        telegram: {
            sendMessage: jest.fn().mockResolvedValue({}),
        },
    },
}));

jest.mock('@/services/core/config.service', () => ({
    ConfigService: {
        getTelegramConfig: jest.fn(),
    },
}));

jest.mock('@/services/users/promo.service', () => ({
    PromoService: {
        checkLoyaltySpend: jest.fn(),
    },
}));

jest.mock('@/services/vip/managed-channel.service', () => ({
    ManagedChannelService: {
        linkOrderToChannel: jest.fn().mockResolvedValue(true),
    },
}));

describe('OrderActivationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('initiateOrder', () => {
        const mockData = {
            userId: 'u1',
            serviceId: 'svc1',
            projectId: 'p1',
            link: 'link1',
            qty: 100,
            totalPrice: new Decimal(10),
            tgId: 12345n,
            username: 'testuser'
        };

        const mockService = {
            id: 'svc1',
            lastProviderPrice: new Decimal(5),
            isActive: true,
            name: 'Service 1'
        };

        const mockOrder = {
            id: 1001,
            internalService: { name: 'Service 1' }
        };

        test('should throw SERVICE_UNAVAILABLE if service not found or inactive', async () => {
            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(OrderActivationService.initiateOrder(mockData)).rejects.toThrow('SERVICE_UNAVAILABLE');
        });

        test('should disable service if it has zero price but marked active', async () => {
             (prisma.internalService.findUnique as jest.Mock).mockResolvedValue({ ...mockService, lastProviderPrice: null });
             await expect(OrderActivationService.initiateOrder(mockData)).rejects.toThrow('SERVICE_UNAVAILABLE');
             expect(prisma.internalService.update).toHaveBeenCalled();
        });

        test('should handle smart fragmentation for large orders', async () => {
            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockService);
            (prisma.project.findUnique as jest.Mock).mockResolvedValue({ marketerSettings: { isSmartFragmentationEnabled: true } });
            (OrderLifecycleService.createOrderRecord as jest.Mock).mockResolvedValue(mockOrder);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', spent: new Decimal(100) });
            (ConfigService.getTelegramConfig as jest.Mock).mockResolvedValue({ adminId: 'a1' });

            const largeData = { ...mockData, qty: 5000 };
            await OrderActivationService.initiateOrder(largeData);

            expect(OrderLifecycleService.createOrderRecord).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({ isDripFeed: true, runs: 10, interval: 240 })
            );
        });

        test('should succeed and notify user/admin on success', async () => {
            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockService);
            (OrderLifecycleService.createOrderRecord as jest.Mock).mockResolvedValue(mockOrder);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', spent: new Decimal(10) });
            (ConfigService.getTelegramConfig as jest.Mock).mockResolvedValue({ adminId: 'a1' });
            (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await OrderActivationService.initiateOrder(mockData);

            expect(result).toEqual(mockOrder);
            expect(OrderFinancialService.chargeOrder).toHaveBeenCalled();
            expect(prisma.transaction.create).toHaveBeenCalled();
        });

        test('should handle notification errors gracefully', async () => {
             (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockService);
            (OrderLifecycleService.createOrderRecord as jest.Mock).mockResolvedValue(mockOrder);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', spent: new Decimal(10) });
            (ConfigService.getTelegramConfig as jest.Mock).mockResolvedValue({ adminId: 'a1' });
            
            const mockBot = BotRegistry.get('p1');
            (mockBot.telegram.sendMessage as jest.Mock).mockRejectedValue(new Error('Bot fail'));

            await OrderActivationService.initiateOrder(mockData);
            expect(true).toBe(true); // Should not throw
        });

        test('should fail if user not found after charge', async () => {
            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockService);
            (OrderLifecycleService.createOrderRecord as jest.Mock).mockResolvedValue(mockOrder);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User vanished?

            await expect(OrderActivationService.initiateOrder(mockData)).rejects.toThrow('User not found after charge');
        });
    });
});
