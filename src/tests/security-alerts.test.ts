/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Test script for Financial Security Alerts
 */
import { FinancialSecurityService } from '../services/security/financial-security.service';
import { BotRegistry } from '../services/bot/bot-registry';
import { ConfigService } from '../services/core/config.service';
import { prisma } from '../lib/prisma';
import { Decimal } from 'decimal.js';

// Mocking
jest.mock('../services/bot/bot-registry');
jest.mock('../services/core/config.service');
jest.mock('../lib/prisma', () => ({
    prisma: {
        provider: {
            findUnique: jest.fn()
        },
        providerBalanceLog: {
            findFirst: jest.fn()
        },
        order: {
            findMany: jest.fn()
        },
        user: {
            findMany: jest.fn()
        }
    }
}));

describe('FinancialSecurityService Alerts', () => {
    const mockSendMessage = jest.fn().mockResolvedValue({});
    const mockAdminId = '123456789';

    beforeEach(() => {
        jest.clearAllMocks();
        (ConfigService.getTelegramConfig as jest.Mock).mockResolvedValue({ adminId: mockAdminId });
        (BotRegistry.get as jest.Mock).mockReturnValue({
            telegram: { sendMessage: mockSendMessage }
        });
    });

    test('should send alert on provider slippage (CRITICAL)', async () => {
        // Setup: Expected Spend 100, Actual Spend 200 (100% slippage)
        (prisma.provider.findUnique as jest.Mock).mockResolvedValue({
            id: 'p1',
            name: 'Test Provider',
            payments: [],
            metadata: { currency: 'USD' }
        });
        (prisma.providerBalanceLog.findFirst as jest.Mock)
            .mockResolvedValueOnce({ balance: new Decimal(1000) }) // start
            .mockResolvedValueOnce({ balance: new Decimal(800) }); // end (spend 200)
        
        (prisma.order.findMany as jest.Mock).mockResolvedValue([
            { costPrice: new Decimal(100), quantity: 1000 }
        ]);

        await FinancialSecurityService.getProviderSlippage('p1');

        expect(mockSendMessage).toHaveBeenCalledWith(
            mockAdminId,
            expect.stringContaining('FINANCIAL ALERT: Provider Slippage'),
            expect.anything()
        );
        expect(mockSendMessage).toHaveBeenCalledWith(
            mockAdminId,
            expect.stringContaining('Status: <b>CRITICAL</b>'),
            expect.anything()
        );
    });

    test('should send alert on user LTV risk (WARNING)', async () => {
        // Setup: User balance 500, Expected balance 0 (Gap 500)
        (prisma.user.findMany as jest.Mock).mockResolvedValue([{
            id: 'u1',
            username: 'testuser',
            balance: new Decimal(500),
            transactions: [] // 0 transactions -> expected 0
        }]);

        await FinancialSecurityService.getSecurityRisks();

        expect(mockSendMessage).toHaveBeenCalledWith(
            mockAdminId,
            expect.stringContaining('SECURITY ALERT: User LTV Risk'),
            expect.anything()
        );
        expect(mockSendMessage).toHaveBeenCalledWith(
            mockAdminId,
            expect.stringContaining('Gap: <b>500.00 RUB</b>'),
            expect.anything()
        );
    });
});
