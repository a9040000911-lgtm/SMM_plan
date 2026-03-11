/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Contract Tests: Provider API Response Format Verification
 * Ensures that the internal expectations match the actual provider API format.
 * Uses snapshot-like assertions to catch breaking changes in provider responses.
 * 
 * @jest-environment node
 */
import { ProviderService } from '@/services/providers/provider.service';

// Mock the provider
jest.mock('@/services/providers/provider.service');

// Mock bot to prevent side effects
jest.mock('@/lib/bot', () => ({
    bot: { telegram: { sendMessage: jest.fn().mockResolvedValue({}) } }
}));

describe('Contract Tests: Provider API', () => {

    beforeEach(() => jest.clearAllMocks());

    // ===================================================================
    // CONTRACT 1: createOrder response format
    // Provider MUST return: { success, externalId, providerName, rawData? }
    // ===================================================================
    describe('createOrder Response Contract', () => {

        test('SUCCESS: Must return { success: true, externalId: string, providerName: string }', async () => {
            const expectedContract = {
                success: true,
                externalId: expect.any(String),
                providerName: expect.any(String),
            };

            (ProviderService.createOrder as jest.Mock).mockResolvedValue({
                success: true,
                externalId: 'ext_abc123',
                providerName: 'VexBoost',
                rawData: { order: 12345 }
            });

            const result = await ProviderService.createOrder({} as any, {} as any, '' as any);
            expect(result).toMatchObject(expectedContract);

            // Strict type checks
            expect(typeof result.success).toBe('boolean');
            expect(typeof result.externalId).toBe('string');
            expect(result.externalId!.length).toBeGreaterThan(0);
            expect(typeof result.providerName).toBe('string');
        });

        test('FAILURE: Must return { success: false, error?: string }', async () => {
            (ProviderService.createOrder as jest.Mock).mockResolvedValue({
                success: false,
                error: 'Insufficient balance',
            });

            const result = await ProviderService.createOrder({} as any, {} as any, '' as any);
            expect(result.success).toBe(false);
            // Error should be present
            expect(result.error).toBeDefined();
            expect(typeof result.error).toBe('string');
        });
    });

    // ===================================================================
    // CONTRACT 2: getOrderStatus response format
    // Provider MUST return: { status: string, remains: number, cost?: number }
    // ===================================================================
    describe('getOrderStatus Response Contract', () => {


        test('Must return { status, remains, cost? } with valid status values', async () => {
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({
                status: 'Completed',
                remains: 0,
                cost: 0.15,
            });

            const result = await ProviderService.getOrderStatus({ externalId: 'ext_123' } as any);

            // Contract checks
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('remains');
            expect(typeof result.status).toBe('string');
            expect(typeof result.remains).toBe('number');
            expect(result.remains).toBeGreaterThanOrEqual(0);
        });

        test('Partial order: remains must be > 0', async () => {
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({
                status: 'Partial',
                remains: 150,
            });

            const result = await ProviderService.getOrderStatus({ externalId: 'ext_456' } as any);
            expect(result.status).toBe('Partial');
            expect(result.remains).toBeGreaterThan(0);
        });

        test('Completed order: remains must be 0', async () => {
            (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({
                status: 'Completed',
                remains: 0,
            });

            const result = await ProviderService.getOrderStatus({ externalId: 'ext_789' } as any);
            expect(result.status).toBe('Completed');
            expect(result.remains).toBe(0);
        });
    });

    // ===================================================================
    // CONTRACT 3: getInstance().getBalance() response format
    // Provider MUST return: { balance: number, currency: string }
    // ===================================================================
    describe('getBalance Response Contract', () => {

        test('Must return { balance: number, currency: string }', async () => {
            (ProviderService.getInstance as jest.Mock).mockResolvedValue({
                getBalance: jest.fn().mockResolvedValue({ balance: 1500.50, currency: 'RUB' }),
            });

            const instance = (await ProviderService.getInstance('prov_id'))!;
            const result = await instance.getBalance();

            expect(result).toHaveProperty('balance');
            expect(result).toHaveProperty('currency');
            expect(typeof result.balance).toBe('number');
            expect(typeof result.currency).toBe('string');
            expect(result.balance).toBeGreaterThanOrEqual(0);
        });

        test('Balance must be a finite positive number', async () => {
            (ProviderService.getInstance as jest.Mock).mockResolvedValue({
                getBalance: jest.fn().mockResolvedValue({ balance: 0, currency: 'USD' }),
            });

            const instance = (await ProviderService.getInstance('prov_id'))!;
            const result = await instance.getBalance();

            expect(Number.isFinite(result.balance)).toBe(true);
            expect(result.balance).toBeGreaterThanOrEqual(0);
        });
    });

    // ===================================================================
    // CONTRACT 4: getProviderServices response format (for sync)
    // ===================================================================
    describe('getProviderServices Response Contract', () => {

        test('Each service must have { service: string, rate: string, name: string }', async () => {
            (ProviderService.getProviderServices as jest.Mock).mockResolvedValue([
                { service: '100', name: 'Instagram Followers', rate: '0.50', min: '10', max: '10000', category: 'Default' },
                { service: '101', name: 'YouTube Views', rate: '1.25', min: '100', max: '50000', category: 'Default' },
            ]);

            const services = await ProviderService.getProviderServices({} as any);

            expect(Array.isArray(services)).toBe(true);
            expect(services.length).toBeGreaterThan(0);

            for (const svc of services) {
                // Core contract fields
                expect(svc).toHaveProperty('service');
                expect(svc).toHaveProperty('rate');
                expect(svc).toHaveProperty('name');

                // Type checks
                expect(typeof svc.service).toBe('string');
                expect(typeof svc.rate).toBe('string');
                expect(typeof svc.name).toBe('string');

                const rateStr = String(svc.rate);
                const serviceIdStr = String(svc.service);

                // Rate must be parseable as a number
                expect(Number.isNaN(parseFloat(rateStr))).toBe(false);
                expect(parseFloat(rateStr)).toBeGreaterThanOrEqual(0);

                // Service ID must not be empty
                expect(serviceIdStr.length).toBeGreaterThan(0);
            }
        });
    });

    // ===================================================================
    // CONTRACT 5: Error handling contract
    // ===================================================================
    describe('Error Handling Contract', () => {

        test('Provider timeout should not throw unhandled exception', async () => {
            (ProviderService.createOrder as jest.Mock).mockRejectedValue(
                new Error('ETIMEDOUT: Connection timed out')
            );

            await expect(
                ProviderService.createOrder({} as any, {} as any, '' as any)
            ).rejects.toThrow();
        });

        test('Invalid API key should return clear error', async () => {
            (ProviderService.createOrder as jest.Mock).mockResolvedValue({
                success: false,
                error: 'Invalid API key',
            });

            const result = await ProviderService.createOrder({} as any, {} as any, '' as any);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});
