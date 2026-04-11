/**
 * @jest-environment node
 */
import { OrderFinancialService } from './order-financial.service';
import { LedgerService } from '@/services/finance/ledger.service';
import { UserRepository } from '@/services/repositories/user.repository';
import { TransactionRepository } from '@/services/repositories/transaction.repository';
import { OrderRepository } from '@/services/repositories/order.repository';
import { Decimal } from 'decimal.js';
import { Prisma } from '@prisma/client';

// Mock dependencies
jest.mock('@/services/finance/ledger.service', () => ({
    LedgerService: {
        record: jest.fn(),
    },
}));

jest.mock('@/services/repositories/user.repository', () => ({
    UserRepository: {
        updateBalance: jest.fn(),
    },
}));

jest.mock('@/services/repositories/transaction.repository', () => ({
    TransactionRepository: {
        create: jest.fn(),
    },
}));

jest.mock('@/services/repositories/order.repository', () => ({
    OrderRepository: {
        atomicRefundUpdate: jest.fn(),
    },
}));

describe('OrderFinancialService', () => {
    const mockTx = {
        $queryRaw: jest.fn().mockResolvedValue([{ balance: new Decimal(90) }]),
    } as unknown as Prisma.TransactionClient;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('chargeOrder', () => {
        test('should successfully charge order and record ledger', async () => {
            const amount = new Decimal(10);
            
            await OrderFinancialService.chargeOrder(mockTx, 'u1', amount, 1001, 'Test Service');
            
            expect((mockTx as any).$queryRaw).toHaveBeenCalled();
            expect(LedgerService.record).toHaveBeenCalled();
            expect(TransactionRepository.create).toHaveBeenCalled();
        });

        test('should throw error if $queryRaw returns empty (balance insufficient)', async () => {
            (mockTx as any).$queryRaw = jest.fn().mockResolvedValue([]);
            const amount = new Decimal(10);
            
            await expect(OrderFinancialService.chargeOrder(mockTx, 'u1', amount, 1001, 'Test Service'))
                .rejects.toThrow(/не может быть запущен/);
        });
    });

    describe('refundOrder', () => {
        const mockOrder = {
            id: 1001,
            userId: 'u1',
            projectId: 'p1',
            totalPrice: new Decimal(100),
        } as any;

        test('should successfully refund and update ledger', async () => {
            (OrderRepository.atomicRefundUpdate as jest.Mock).mockResolvedValue(true);
            (UserRepository.updateBalance as jest.Mock).mockResolvedValue(true);
            
            const refundAmount = new Decimal(50);
            await OrderFinancialService.refundOrder(mockTx, mockOrder, refundAmount, 'PARTIAL', 500, 'Partial refund');
            
            expect(OrderRepository.atomicRefundUpdate).toHaveBeenCalled();
            expect(LedgerService.record).toHaveBeenCalled();
            expect(UserRepository.updateBalance).toHaveBeenCalledWith('u1', refundAmount, expect.any(Object), mockTx);
            expect(TransactionRepository.create).toHaveBeenCalled();
        });

        test('should return early if atomicRefundUpdate fails (concurrent protection)', async () => {
            (OrderRepository.atomicRefundUpdate as jest.Mock).mockResolvedValue(false);
            
            await OrderFinancialService.refundOrder(mockTx, mockOrder, new Decimal(10), 'CANCELED', 0, 'Reason');
            
            expect(LedgerService.record).not.toHaveBeenCalled();
            expect(UserRepository.updateBalance).not.toHaveBeenCalled();
        });
    });
});
