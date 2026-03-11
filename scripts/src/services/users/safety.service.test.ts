/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { SafetyService } from '@/services/users';
import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers';
import { Decimal } from 'decimal.js';

// Mocking Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    internalService: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    providerService: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    provider: {
      findUnique: jest.fn(),
    },
    settings: {
      findFirst: jest.fn(),
    },
    order: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalPrice: null } })
    }
  },
}));

// Mock ProviderService
jest.mock('@/services/providers');

// Mock bot to prevent side effects
jest.mock('@/lib/bot', () => ({
  bot: {
    telegram: {
      sendMessage: jest.fn().mockResolvedValue({})
    }
  }
}));

describe('Safety Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should block order if selling price is less than cost (loss)', async () => {
    const mockService = {
      id: 'test-svc',
      name: 'Test Service',
      pricePer1000: new Decimal(10), // We sell for 10
      providerMappings: [{
        providerId: 'vex-uuid',
        providerServiceId: 100
      }]
    };

    (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockService);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ safetySettings: {} });
    (ProviderService.getProviderServices as jest.Mock).mockResolvedValue([
        { service: '100', rate: '50.00' } // Cost is 50
    ]);

    const res = await SafetyService.validateOrder('test-svc', 1000, 'global');
    
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/Технические работы|Technical works/);
    expect(prisma.internalService.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'test-svc' },
        data: expect.objectContaining({ isActive: false })
    }));
  });

  test('should pass if margin is adequate', async () => {
    const mockService = {
      id: 'test-svc',
      name: 'Test Service',
      pricePer1000: new Decimal(200), // We sell for 200
      providerMappings: [{
        providerId: 'vex-uuid',
        providerServiceId: 100
      }]
    };

    (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockService);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ safetySettings: {} });
    (ProviderService.getProviderServices as jest.Mock).mockResolvedValue([
        { service: '100', rate: '10.00' } // Cost is 10
    ]);

    const res = await SafetyService.validateOrder('test-svc', 1000, 'global');
    
    expect(res.valid).toBe(true);
  });

  test('should skip check for free test', async () => {
    const mockService = {
      id: 'free-test',
      pricePer1000: new Decimal(0),
    };
    (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockService);

    const res = await SafetyService.validateOrder('free-test', 100, 'global');
    expect(res.valid).toBe(true);
  });

  test('should skip check for free test', async () => {
    const mockService = {
      id: 'free-test',
      pricePer1000: new Decimal(0),
    };
    (prisma.internalService.findUnique as jest.Mock).mockResolvedValue(mockService);

    const res = await SafetyService.validateOrder('free-test', 100, 'global');
    expect(res.valid).toBe(true);
  });
});
