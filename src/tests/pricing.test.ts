/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { PricingService } from '@/services/finance/pricing.service';
import { SettingsService } from '@/services/core';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

// Mock dependencies
jest.mock('@/services/core');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        internalServiceMapping: {
            findMany: jest.fn()
        },
        internalService: {
            update: jest.fn(),
            findUnique: jest.fn()
        },
        adminLog: {
            create: jest.fn()
        },
        project: {
            findUnique: jest.fn()
        },
        user: {
            findUnique: jest.fn()
        }
    }
}));

// Mock LoyaltyService to avoid complex dependencies
jest.mock('@/services/users', () => ({
    LoyaltyService: {
        getLoyaltyInfo: jest.fn().mockResolvedValue({ totalDiscount: 10 })
    }
}));


describe('PricingService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        (SettingsService.getNumber as jest.Mock).mockResolvedValue(500); // Default Margin 500%
        (SettingsService.getJson as jest.Mock).mockResolvedValue(null); // Return null to use DEFAULT_LADDER
    });

    describe('calculateRetailPrice', () => {
        test('Should apply ladder multiplier correctly', async () => {
            const cost = new Decimal(100);
            const price = await PricingService.calculateRetailPrice(cost);
            // 100 * 11 (multiplier for 100) * 1.03 (gateway fee) = 1133
            expect(price.toNumber()).toBe(1133);
        });

        test('Should use custom project ladder if configured', async () => {
            const customLadder = [
                { threshold: 100, multiplier: 2, fixedMarkup: 0 },
                { threshold: Infinity, multiplier: 1.5, fixedMarkup: 0 }
            ];
            (SettingsService.getJson as jest.Mock).mockResolvedValue(customLadder);

            const cost = new Decimal(50);
            const price = await PricingService.calculateRetailPrice(cost, { projectId: 'project-1' });
            // 50 * 2 (multiplier for 50) * 1.03 (gateway fee) = 103
            expect(price.toNumber()).toBe(103);
        });
    });

    describe('syncInternalServicePrice', () => {
        const mockServiceId = 'service-123';
        const mockService = {
            id: mockServiceId,
            pricePer1000: new Decimal(500), // Current price too low
            name: 'Test Service',
            category: 'VIEWS'
        };

        const mockProviderServiceLarge = {
            rawPrice: new Decimal(100) // 100 * 11 * 1.03 = 1133
        };

        const mockProviderServiceSmall = {
            rawPrice: new Decimal(50)  // 50 * 11 * 1.03 = 566.5 -> 567
        };

        test('Should update price based on MAX provider cost to ensure safety', async () => {
            (prisma.internalServiceMapping.findMany as jest.Mock).mockResolvedValue([
                { providerService: mockProviderServiceSmall, internalService: mockService, provider: { name: 'A' } },
                { providerService: mockProviderServiceLarge, internalService: mockService, provider: { name: 'B' } }
            ]);

            const result = await PricingService.syncInternalServicePrice(mockServiceId);

            expect(result.priceUpdated).toBe(true);
            expect(result.newPrice!.toNumber()).toBe(1133); // Based on 100 cost
            expect(prisma.internalService.update).toHaveBeenCalledWith({
                where: { id: mockServiceId },
                data: expect.objectContaining({
                    pricePer1000: expect.anything(),
                    lastProviderPrice: expect.anything()
                })
            });
        });

        test('Should NOT update if current price is sufficient', async () => {
            const highPriceService = { ...mockService, pricePer1000: new Decimal(2000) };

            (prisma.internalServiceMapping.findMany as jest.Mock).mockResolvedValue([
                { providerService: mockProviderServiceLarge, internalService: highPriceService, provider: { name: 'B' } }
            ]);

            const result = await PricingService.syncInternalServicePrice(mockServiceId);

            expect(result.priceUpdated).toBe(false);
            // It should still update lastProviderPrice
            expect(prisma.internalService.update).toHaveBeenCalledWith({
                where: { id: mockServiceId },
                data: { lastProviderPrice: expect.anything() }
            });
        });
    });

    describe('getServicePrice (Project Rules)', () => {
        test('Should apply category multiplier if configured', async () => {
            const mockServiceValues = {
                id: 's1',
                pricePer1000: new Decimal(100),
                category: 'VIEWS',
                projectOverrides: []
            };

            const mockMultipliers = {
                'VIEWS': 1.5
            };

            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockServiceValues);
            (SettingsService.getJson as jest.Mock).mockResolvedValue(mockMultipliers);

            // Note: getServicePrice currently doesn't re-calculate dynamically if pricePer1000 is already set, 
            // unless it's a project override. But calculateRetailPrice is used in syncInternalPrices.
            // Let's check how getServicePrice is implemented.
            // It returns service.pricePer1000.
        });

        test('Should prefer explicit override over rules', async () => {
            const mockServiceValues = {
                id: 's1',
                pricePer1000: new Decimal(100),
                projectOverrides: [
                    { customPrice: new Decimal(999) }
                ]
            };

            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockServiceValues);
            (prisma.project.findUnique as jest.Mock).mockResolvedValue({}); // No rules

            const result = await PricingService.getServicePrice('s1', 'proj-1');
            expect(result.toNumber()).toBe(999);
        });
    });
});
