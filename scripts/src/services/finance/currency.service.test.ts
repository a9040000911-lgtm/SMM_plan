/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Currency Service Tests
 * Verifies exchange rate conversion and formatting logic.
 */
import { CurrencyService } from './currency.service';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        currencyRate: {
            findMany: jest.fn(),
        }
    }
}));

describe('CurrencyService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Conversion Logic', () => {
        test('should return same amount if from and to are same', async () => {
            const amount = new Decimal(100);
            const result = await CurrencyService.convert(amount, 'RUB', 'RUB');
            expect(result.toNumber()).toBe(100);
        });

        test('should convert USD to RUB using provided rates', async () => {
            (prisma.currencyRate.findMany as jest.Mock).mockResolvedValue([
                { code: 'USD', rate: new Decimal(90) }
            ]);

            const amount = new Decimal(1); // 1 USD
            const result = await CurrencyService.convert(amount, 'USD', 'RUB');
            expect(result.toNumber()).toBe(90);
        });

        test('should convert RUB to EUR using provided rates', async () => {
            (prisma.currencyRate.findMany as jest.Mock).mockResolvedValue([
                { code: 'EUR', rate: new Decimal(100) }
            ]);

            const amount = new Decimal(200); // 200 RUB
            const result = await CurrencyService.convert(amount, 'RUB', 'EUR');
            expect(result.toNumber()).toBe(2);
        });

        test('should use fallback rates if DB is empty', async () => {
            (prisma.currencyRate.findMany as jest.Mock).mockResolvedValue([]);

            const amount = new Decimal(1); // 1 USD (fallback is 90)
            const result = await CurrencyService.convert(amount, 'USD', 'RUB');
            expect(result.toNumber()).toBe(90);
        });
    });

    describe('Formatting Logic', () => {
        test('should format RUB correctly', () => {
            const result = CurrencyService.format(1234.56, 'RUB');
            // result might vary by OS but should contain ruble symbol or code
            expect(result).toMatch(/1\s?234,56\s?₽/);
        });

        test('should format USD correctly', () => {
            const result = CurrencyService.format(1234.56, 'USD');
            expect(result).toMatch(/\$1,234.56/);
        });
    });
});
