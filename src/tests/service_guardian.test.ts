/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { ServiceGuardian } from '@/services/providers/service-guardian.service';
import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers/provider.service';
import { CurrencyService } from '@/services/finance/currency.service';
import { Decimal } from 'decimal.js';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        providerService: {
            findUnique: jest.fn(),
        },
        internalService: {
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        adminLog: {
            create: jest.fn(),
        },
        user: {
            findMany: jest.fn(),
        }
    },
}));

jest.mock('@/services/providers/provider.service');
jest.mock('@/services/finance/currency.service');
jest.mock('@/lib/bot', () => ({
    bot: {
        telegram: {
            sendMessage: jest.fn().mockResolvedValue({}),
        },
    },
}));

describe('ServiceGuardian', () => {
    const mockMapping = {
        providerId: 'prov-1',
        providerServiceId: 100,
        internalServiceId: 'int-1'
    };

    const mockStoredService = {
        id: 100,
        name: 'Instagram Followers High Quality',
        rawPrice: new Decimal(100),
        provider: {
            name: 'VexBoost',
            type: 'universal',
            metadata: { currency: 'RUB' }
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (CurrencyService.getRates as jest.Mock).mockResolvedValue({ RUB: 1, USD: 100 });
    });

    test('should pass if price increase is within limits (e.g. +5%)', async () => {
        (prisma.providerService.findUnique as jest.Mock).mockResolvedValue(mockStoredService);

        const mockProviderInstance = {
            getServices: jest.fn().mockResolvedValue([
                { service: 100, name: 'Instagram Followers High Quality', rate: 105 } // +5%
            ])
        };
        (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockProviderInstance);

        const result = await ServiceGuardian.verifyService('int-1', mockMapping);

        expect(result.isValid).toBe(true);
        expect(result.criticalChange).toBe(false);
        expect(result.priceDeltaPercent).toBeCloseTo(5);
    });

    test('should handle minor price increase (+15%) and trigger notification', async () => {
        (prisma.providerService.findUnique as jest.Mock).mockResolvedValue(mockStoredService);
        (prisma.internalService.findUnique as jest.Mock).mockResolvedValue({ name: 'Test Service' });
        (prisma.user.findMany as jest.Mock).mockResolvedValue([{ tgId: '123' }]);

        const mockProviderInstance = {
            getServices: jest.fn().mockResolvedValue([
                { service: 100, name: 'Instagram Followers High Quality', rate: 115 } // +15%
            ])
        };
        (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockProviderInstance);

        const result = await ServiceGuardian.verifyService('int-1', mockMapping);

        expect(result.isValid).toBe(true);
        expect(result.priceDeltaPercent).toBeCloseTo(15);

        // Test the notification method separately or check if it's called if integrated
        await ServiceGuardian.notifyMinorPriceChange('int-1', 15, new Decimal(100), new Decimal(115));
        const { bot } = await import('@/lib/bot');
        expect(bot.telegram.sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('+15.0%'), expect.any(Object));
    });

    test('should block and disable service on critical price spike (+50%)', async () => {
        (prisma.providerService.findUnique as jest.Mock).mockResolvedValue(mockStoredService);
        (prisma.internalService.update as jest.Mock).mockResolvedValue({ name: 'Test', platform: 'TG' });
        (prisma.user.findMany as jest.Mock).mockResolvedValue([{ tgId: '123' }]);

        const mockProviderInstance = {
            getServices: jest.fn().mockResolvedValue([
                { service: 100, name: 'Instagram Followers High Quality', rate: 150 } // +50%
            ])
        };
        (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockProviderInstance);

        const result = await ServiceGuardian.verifyService('int-1', mockMapping);

        expect(result.isValid).toBe(false);
        expect(result.criticalChange).toBe(true);
        expect(result.reason).toContain('Price spike detected');

        // Verify service disabling
        await ServiceGuardian.disableService('int-1', 'Price Spike');
        expect(prisma.internalService.update).toHaveBeenCalledWith({
            where: { id: 'int-1' },
            data: { isActive: false },
            select: expect.any(Object)
        });
    });

    test('should block order if service name changed significantly (Type swap)', async () => {
        (prisma.providerService.findUnique as jest.Mock).mockResolvedValue(mockStoredService);

        const mockProviderInstance = {
            getServices: jest.fn().mockResolvedValue([
                { service: 100, name: 'Instagram LIKES (Real)', rate: 100 } // Changed Followers -> Likes
            ])
        };
        (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockProviderInstance);

        const result = await ServiceGuardian.verifyService('int-1', mockMapping);

        expect(result.isValid).toBe(false);
        expect(result.criticalChange).toBe(true);
        expect(result.reason).toContain('Service name mismatch');
    });

    test('should handle currency change (e.g. provider switched from RUB to USD)', async () => {
        // Stored: 100 RUB
        (prisma.providerService.findUnique as jest.Mock).mockResolvedValue({
            ...mockStoredService,
            provider: { ...mockStoredService.provider, metadata: { currency: 'USD' } }
        });

        // Rates: 1 USD = 100 RUB. 
        // Provider gives rate 1.5 USD. Actual price = 150 RUB (+50%)
        const mockProviderInstance = {
            getServices: jest.fn().mockResolvedValue([
                { service: 100, name: 'Instagram Followers High Quality', rate: 1.5 }
            ])
        };
        (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockProviderInstance);

        const result = await ServiceGuardian.verifyService('int-1', mockMapping);

        expect(result.isValid).toBe(false);
        expect(result.criticalChange).toBe(true);
        expect(result.priceDeltaPercent).toBe(50);
    });
});
