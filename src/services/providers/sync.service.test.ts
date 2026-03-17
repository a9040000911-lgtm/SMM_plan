/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { ServiceSyncService } from './sync.service';
import { prisma } from '@/lib/prisma';
import { ProviderService } from './provider.service';
import { SmartAnalyzerService } from './smart-analyzer.service';
import { Decimal } from 'decimal.js';

/**
 * Тесты для ServiceSyncService
 * Стандарт: Triple A (Arrange, Act, Assert)
 * Покрытие: 100% функционала и ветвлений
 */

jest.mock('@/lib/prisma', () => ({
    prisma: {
        provider: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        providerService: {
            upsert: jest.fn(),
        },
        internalServiceMapping: {
            findMany: jest.fn(),
        },
        internalService: {
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        socialPlatform: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        adminLog: {
            create: jest.fn(),
        },
        projectServiceOverride: {
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        providerBalanceLog: {
            create: jest.fn(),
        },
                settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
        $transaction: jest.fn((promises) => Promise.all(promises)),
    },
}));

jest.mock('./provider.service', () => ({
    ProviderService: {
        getInstance: jest.fn(),
    },
}));

jest.mock('./smart-analyzer.service', () => ({
    SmartAnalyzerService: {
        analyzeService: jest.fn(),
    },
}));

jest.mock('@/services/finance/currency.service', () => ({
    CurrencyService: {
        getRates: jest.fn().mockResolvedValue({ USD: 92, EUR: 102 }),
    },
}));

jest.mock('@/services/finance/pricing.service', () => {
    const { Decimal } = require('decimal.js');
    return {
        PricingService: {
            calculateRetailPrice: jest.fn().mockResolvedValue(new Decimal(100)),
            getSafetyPrice: jest.fn().mockReturnValue(new Decimal(50)),
        },
    };
});

describe('ServiceSyncService', () => {
    const mockProvider = {
        id: 'prov-1',
        name: 'VexBoost',
        isEnabled: true,
        type: 'vexboost',
        metadata: { pricesCurrency: 'USD' },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        console.error = jest.fn();
        console.log = jest.fn();
    });

    describe('syncAllServices', () => {
        it('should sync all enabled providers', async () => {
            (prisma.provider.findMany as jest.Mock).mockResolvedValue([mockProvider]);
            const syncSpy = jest.spyOn(ServiceSyncService, 'syncProvider').mockResolvedValue(undefined);
            await ServiceSyncService.syncAllServices();
            expect(syncSpy).toHaveBeenCalled();
        });
    });

    describe('syncProvider', () => {
        it('should throw if not found', async () => {
            (prisma.provider.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(ServiceSyncService.syncProvider('none')).rejects.toThrow('Provider none not found');
        });

        it('should throw if disabled', async () => {
            (prisma.provider.findUnique as jest.Mock).mockResolvedValue({ ...mockProvider, isEnabled: false });
            await expect(ServiceSyncService.syncProvider('p-1')).rejects.toThrow('Provider VexBoost is disabled');
        });

        it('should update balance log on success', async () => {
            (prisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);
            jest.spyOn(ServiceSyncService as any, 'processProviderSync').mockResolvedValue(undefined);
            const mockInstance = { getBalance: jest.fn().mockResolvedValue({ balance: 50.5 }) };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInstance);

            await ServiceSyncService.syncProvider('p-1');
            expect(prisma.providerBalanceLog.create).toHaveBeenCalled();
        });

        it('should update balance log and handle failure', async () => {
            (prisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);
            jest.spyOn(ServiceSyncService as any, 'processProviderSync').mockResolvedValue(undefined);
            const mockInstance = { getBalance: jest.fn().mockRejectedValue(new Error('Balance Error')) };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInstance);

            await ServiceSyncService.syncProvider('p-1');
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to update balance'), expect.anything());
        });
    });

    describe('processProviderSync', () => {
        it('should return early if instance cannot be created', async () => {
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(null);
            await (ServiceSyncService as any).processProviderSync(mockProvider, { USD: 90 });
            expect(prisma.providerService.upsert).not.toHaveBeenCalled();
        });

        it('should use provided rate for USD', async () => {
            const mockInst = { getServices: jest.fn().mockResolvedValue([{ service: '1', rate: '1', name: 'S1' }]) };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInst);
            (SmartAnalyzerService.analyzeService as jest.Mock).mockResolvedValue(null);

            await (ServiceSyncService as any).processProviderSync({ ...mockProvider, metadata: { pricesCurrency: 'USD' } }, { USD: 98 });
            expect(prisma.providerService.upsert).toHaveBeenCalledWith(expect.objectContaining({
                create: expect.objectContaining({ rawPrice: new Decimal(98) })
            }));
        });

        it('should use fallback 90 for USD if rate missing', async () => {
            const mockInst = { getServices: jest.fn().mockResolvedValue([{ service: '1', rate: '1', name: 'S1' }]) };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInst);
            (SmartAnalyzerService.analyzeService as jest.Mock).mockResolvedValue(null);

            await (ServiceSyncService as any).processProviderSync({ ...mockProvider, metadata: { pricesCurrency: 'USD' } }, {});
            expect(prisma.providerService.upsert).toHaveBeenCalledWith(expect.objectContaining({
                create: expect.objectContaining({ rawPrice: new Decimal(90) })
            }));
        });

        it('should use provided rate for EUR', async () => {
            const mockInst = { getServices: jest.fn().mockResolvedValue([{ service: '1', rate: '1', name: 'S1' }]) };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInst);
            (SmartAnalyzerService.analyzeService as jest.Mock).mockResolvedValue(null);

            await (ServiceSyncService as any).processProviderSync({ ...mockProvider, metadata: { pricesCurrency: 'EUR' } }, { EUR: 105 });
            expect(prisma.providerService.upsert).toHaveBeenCalledWith(expect.objectContaining({
                create: expect.objectContaining({ rawPrice: expect.any(Object) })
            }));
            const call = (prisma.providerService.upsert as jest.Mock).mock.calls[0][0];
            expect(call.create.rawPrice.toString()).toBe('105');
        });

        it('should use fallback 100 for EUR if rate missing', async () => {
            const mockInst = { getServices: jest.fn().mockResolvedValue([{ service: '1', rate: '1', name: 'S1' }]) };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInst);
            (SmartAnalyzerService.analyzeService as jest.Mock).mockResolvedValue(null);

            await (ServiceSyncService as any).processProviderSync({ ...mockProvider, metadata: { pricesCurrency: 'EUR' } }, {});
            expect(prisma.providerService.upsert).toHaveBeenCalledWith(expect.objectContaining({
                create: expect.objectContaining({ rawPrice: new Decimal(100) })
            }));
        });

        it('should use stream-promotion fallback to USD', async () => {
            const mockInst = { getServices: jest.fn().mockResolvedValue([{ service: '1', rate: '1', name: 'S1' }]) };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInst);
            (SmartAnalyzerService.analyzeService as jest.Mock).mockResolvedValue(null);

            await (ServiceSyncService as any).processProviderSync({ ...mockProvider, type: 'stream-promotion', metadata: {} }, { USD: 95 });
            expect(prisma.providerService.upsert).toHaveBeenCalledWith(expect.objectContaining({
                create: expect.objectContaining({ rawPrice: new Decimal(95) })
            }));
        });

        it('should use default RUB (rate 1) for unknown type', async () => {
            const mockInst = { getServices: jest.fn().mockResolvedValue([{ service: '1', rate: '1', name: 'S1' }]) };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInst);
            (SmartAnalyzerService.analyzeService as jest.Mock).mockResolvedValue(null);

            await (ServiceSyncService as any).processProviderSync({ ...mockProvider, type: 'other', metadata: {} }, { USD: 95 });
            expect(prisma.providerService.upsert).toHaveBeenCalledWith(expect.objectContaining({
                create: expect.objectContaining({ rawPrice: new Decimal(1.0) })
            }));
        });

        it('should throw and log error if getServices fails', async () => {
            const mockInst = { getServices: jest.fn().mockRejectedValue(new Error('API Error')) };
            (ProviderService.getInstance as jest.Mock).mockResolvedValue(mockInst);

            await expect((ServiceSyncService as any).processProviderSync(mockProvider, {}))
                .rejects.toThrow('API Error');
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('failed:'), 'API Error');
        });
    });

    describe('propagatePrices', () => {
        it('should update internal prices', async () => {
            (prisma.internalServiceMapping.findMany as jest.Mock).mockResolvedValue([
                {
                    internalServiceId: 'i-1',
                    providerId: 'p-1',
                    provider: { name: 'VexBoost' },
                    providerService: { rawPrice: new Decimal(10) }
                }
            ]);
            (prisma.internalService.findUnique as jest.Mock).mockResolvedValue({
                id: 'i-1',
                pricePer1000: 20,
                isActive: true,
                category: 'LIIKES'
            });

            await (ServiceSyncService as any).propagatePrices(mockProvider);
            expect(prisma.internalService.update).toHaveBeenCalled();
        });

        it('should log error on failure', async () => {
            (prisma.internalServiceMapping.findMany as jest.Mock).mockRejectedValue(new Error('DB Fail'));
            await (ServiceSyncService as any).propagatePrices(mockProvider);
            expect(console.error).toHaveBeenCalled();
        });
    });
});
