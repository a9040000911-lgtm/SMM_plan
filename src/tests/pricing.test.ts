/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

// SYSTEMIC FIX: Mock the generated client BEFORE any imports
jest.mock('@/generated/client', () => ({
    Platform: { TELEGRAM: 'TELEGRAM', INSTAGRAM: 'INSTAGRAM' },
    Category: { VIEWS: 'VIEWS', SUBSCRIBERS: 'SUBSCRIBERS' },
    Currency: { RUB: 'RUB', USD: 'USD' }
}));

// Mock SettingsService COMPLETELY
jest.mock('@/services/core', () => ({
    SettingsService: {
        getNumber: jest.fn(),
        getJson: jest.fn(),
        get: jest.fn()
    }
}));

// Mock prisma COMPLETELY
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
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    }
}));

// Mock LoyaltyService
jest.mock('@/services/users', () => ({
    LoyaltyService: {
        getLoyaltyInfo: jest.fn().mockResolvedValue({ totalDiscount: 0 })
    }
}));

import { PricingService } from '@/services/finance/pricing.service';
import { SettingsService } from '@/services/core';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

describe('PricingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks that PricingService expects
        (SettingsService.getNumber as jest.Mock).mockResolvedValue(500); // 500% margin
        (SettingsService.getJson as jest.Mock).mockResolvedValue(null); // Use default ladder
        (SettingsService.get as jest.Mock).mockResolvedValue('any');
    });

    describe('calculateRetailPrice', () => {
        test('Should apply ladder multiplier correctly', async () => {
            const cost = new Decimal(100);
            const price = await PricingService.calculateRetailPrice(cost);
            // Default ladder for 100 is 11. Multiplier: 11 * 1.03 = 11.33. Price: 100 * 11.33 = 1133.
            expect(price.toNumber()).toBe(1133);
        });
    });

    describe('syncInternalServicePrice', () => {
        test('Should update price when current is too low', async () => {
            const mockServiceId = 'service-123';
            const mockService = {
                id: mockServiceId,
                pricePer1000: new Decimal(500),
                name: 'Test Service',
                category: 'VIEWS'
            };

            (prisma.internalServiceMapping.findMany as jest.Mock).mockResolvedValue([
                { 
                    providerService: { rawPrice: new Decimal(100) }, 
                    internalService: mockService, 
                    provider: { name: 'Provider' } 
                }
            ]);

            const result = await PricingService.syncInternalServicePrice(mockServiceId);
            expect(result.priceUpdated).toBe(true);
            expect(result.newPrice!.toNumber()).toBe(1133);
        });
    });
});
