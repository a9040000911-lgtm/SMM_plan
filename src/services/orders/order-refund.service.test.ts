/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { OrderRefundService } from '@/services/orders/order-refund.service';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn((callback) => callback({
      order: {
        findUnique: jest.fn(),
        update: jest.fn()
      },
      user: {
        update: jest.fn()
      },
      transaction: {
        create: jest.fn()
      },
      userPromo: {
        update: jest.fn()
      }
    })),
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    providerBalanceLog: {
      findMany: jest.fn()
    },
    provider: {
      findMany: jest.fn()
    },
    settings: {
      findUnique: jest.fn()
    }
  },
}));

jest.mock('@/services/finance/ledger.service', () => ({
  LedgerService: {
    record: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('@/bot/index', () => ({
  bot: {
    telegram: {
      sendMessage: jest.fn().mockResolvedValue({})
    }
  }
}));

describe('Order Processor Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle refund correctly', async () => {
    const mockOrder = {
      id: 'o1',
      userId: 'u1',
      projectId: 'p1',
      totalPrice: new Decimal(100),
      quantity: 100,
      refundedAmount: new Decimal(0),
      status: 'PROCESSING',
      internalService: {
        name: 'Test Service'
      }
    };

    // We need to capture the transaction context to mock findUnique inside it
    const txMock = {
      order: {
        findUnique: jest.fn().mockResolvedValue(mockOrder),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u1', balance: new Decimal(0), spent: new Decimal(0) }),
        update: jest.fn().mockResolvedValue({})
      },
      transaction: {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(null)
      },
      ledgerEntry: {
        create: jest.fn().mockResolvedValue({})
      },
      loyaltyLog: {
        findMany: jest.fn().mockResolvedValue([])
      },
      userPromo: {
        update: jest.fn().mockResolvedValue({})
      },
      adminLog: {
        create: jest.fn().mockResolvedValue({})
      }
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => callbackWithContext(cb, txMock));

    await OrderRefundService.handleRefund(mockOrder as any, 'CANCELED', 0);

    expect(txMock.order.update).toHaveBeenCalled();
    expect(txMock.user.update).toHaveBeenCalled();
  });
});

async function callbackWithContext(cb: any, context: any) {
  return await cb(context);
}


