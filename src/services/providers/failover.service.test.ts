/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Provider Failover Service Tests
 * Verifies automatic order rerouting logic.
 */
import { FailoverService } from './failover.service';
import { ProviderService } from './provider.service';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        order: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        provider: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
        },
        adminLog: {
            create: jest.fn(),
        }
    }
}));

jest.mock('./provider.service', () => ({
    ProviderService: {
        cancelOrder: jest.fn().mockResolvedValue({ success: true }),
        getInstance: jest.fn(),
    }
}));

describe('FailoverService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('failoverOrder', () => {
        test('should switch to next provider in priority list', async () => {
            // 1. Setup order with mappings
            const mockOrder = {
                id: 123,
                externalId: 'old-ext-id', // REQUIRED for cancelOrder to be called
                link: 'https://test.com',
                quantity: 100,
                providerName: 'ProviderA',
                internalService: {
                    providerMappings: [
                        { providerId: 'id-a', priority: 1, isActive: true, providerServiceId: 1 },
                        { providerId: 'id-b', priority: 2, isActive: true, providerServiceId: 2 },
                    ]
                }
            };

            (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
            (prisma.provider.findFirst as jest.Mock).mockResolvedValue({ id: 'id-a', name: 'ProviderA' });
            (prisma.provider.findUnique as jest.Mock).mockResolvedValue({ id: 'id-b', name: 'ProviderB' });

            // 2. Mock next provider instance
            const mockInstance = {
                createOrder: jest.fn().mockResolvedValue({ success: true, externalId: 'ext-456' })
            };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInstance);

            // 3. Execute failover
            const result = await FailoverService.failoverOrder(123);

            // 4. Assertions
            expect(result?.success).toBe(true);
            expect(result?.newExternalId).toBe('ext-456');
            expect(ProviderService.cancelOrder).toHaveBeenCalled();
            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 123 },
                data: expect.objectContaining({
                    externalId: 'ext-456',
                    providerName: 'ProviderB'
                })
            });
            expect(prisma.adminLog.create).toHaveBeenCalled();
        });

        test('should throw error if no next provider available', async () => {
            const mockOrder = {
                id: 123,
                providerName: 'ProviderFinal',
                internalService: {
                    providerMappings: [
                        { providerId: 'id-final', priority: 1, isActive: true },
                    ]
                }
            };

            (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
            (prisma.provider.findFirst as jest.Mock).mockResolvedValue({ id: 'id-final', name: 'ProviderFinal' });

            await expect(FailoverService.failoverOrder(123)).rejects.toThrow('Нет доступных альтернативных провайдеров');
        });
    });
});
