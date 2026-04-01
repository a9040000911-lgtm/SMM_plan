/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * ProviderService — Unit Tests
 */

jest.mock('@/lib/prisma', () => ({
    prisma: {
        provider: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
        internalService: { findUnique: jest.fn() },
        internalServiceMapping: { findMany: jest.fn(), findFirst: jest.fn() },
        order: { findUnique: jest.fn() },
        providerBalanceLog: { create: jest.fn() },
        settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    },
}));
jest.mock('@/lib/logger', () => ({ createLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }) }));
jest.mock('@/services/core/crypto.service', () => ({ CryptoService: { decrypt: jest.fn((v: string) => v) } }));
jest.mock('@/services/intelligence/intelligence.engine', () => ({
    IntelligenceEngine: { analyzeLink: jest.fn().mockResolvedValue({}), formatForProvider: jest.fn((_, __) => 'https://t.me/test') },
}));
jest.mock('./service-guardian.service', () => ({
    ServiceGuardian: { verifyService: jest.fn().mockResolvedValue({ isValid: true, criticalChange: false }), disableService: jest.fn() },
}));

import { ProviderService } from './provider.service';
import { prisma } from '@/lib/prisma';

describe('ProviderService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('getInstance', () => {
        it('returns null if provider not found', async () => {
            (prisma.provider.findUnique as jest.Mock).mockResolvedValue(null);
            const result = await ProviderService.getInstance('nonexistent');
            expect(result).toBeNull();
        });

        it('returns a UniversalProvider instance for known provider', async () => {
            (prisma.provider.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1', name: 'Test', type: 'universal', apiKey: 'key', apiUrl: 'https://api.test.com', isEnabled: true, metadata: {}
            });
            const instance = await ProviderService.getInstance('p1');
            expect(instance).toBeTruthy();
        });
    });

    describe('getOrderStatus', () => {
        it('throws if no externalId', async () => {
            await expect(ProviderService.getOrderStatus({ externalId: null } as any)).rejects.toThrow('No external ID');
        });
    });

    describe('cancelOrder', () => {
        it('returns error if no externalId', async () => {
            const result = await ProviderService.cancelOrder({ externalId: null } as any);
            expect(result.success).toBe(false);
        });

        it('returns error if no provider assigned', async () => {
            const result = await ProviderService.cancelOrder({ externalId: 'e1', providerName: null } as any);
            expect(result.success).toBe(false);
        });
    });

    describe('getStatuses', () => {
        it('returns empty object for empty externalIds', async () => {
            const result = await ProviderService.getStatuses('p1', []);
            expect(result).toEqual({});
        });
    });

    describe('pingProvider', () => {
        it('returns success false if provider not found', async () => {
            (prisma.provider.findUnique as jest.Mock).mockResolvedValue(null);
            const result = await ProviderService.pingProvider('nonexistent');
            expect(result.success).toBe(false);
        });
    });
});
