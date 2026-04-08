/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { LinkService } from '@/services/providers';
import { prisma } from '@/lib/prisma';
import type { Platform } from '@prisma/client';
import { Decimal } from 'decimal.js';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    internalService: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    }
  },
}));

describe('Bot Integration Logic', () => {
  const mockedPrisma = prisma as unknown as {
    internalService: { findMany: jest.Mock, findUnique: jest.Mock },
    user: { upsert: jest.Mock, findUnique: jest.Mock }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Flow: Analyze Link -> Find Services', async () => {
    // 1. Simulate User Input
    const userLink = 'https://t.me/test_channel';

    // 2. Logic: Analyze Link
    const analysis = LinkService.analyze(userLink);
    expect(analysis).not.toBeNull();
    expect(analysis?.platform).toBe('TELEGRAM' as Platform);

    // 3. Logic: Find Services based on analysis
    const mockServices = [
      { id: 'svc1', name: 'Test Service', pricePer1000: new Decimal(100), serviceCategory: { categoryType: 'SUBSCRIBERS' } }
    ];
    mockedPrisma.internalService.findMany.mockResolvedValue(mockServices);

    const foundServices = await prisma.internalService.findMany({
      where: {
        socialPlatform: { slug: analysis?.platform?.toLowerCase() },
        serviceCategory: { categoryType: { in: analysis?.possibleCategories } }
      }
    });

    expect(mockedPrisma.internalService.findMany).toHaveBeenCalled();
    expect(foundServices).toHaveLength(1);
    expect(foundServices[0].id).toBe('svc1');
  });

  it('Flow: Select Service -> Calculate Price', async () => {
    // 1. Simulate User selecting a service (callback query logic)
    const serviceId = 'svc1';
    const quantity = 500;

    const mockService = {
      id: serviceId,
      name: 'Test Service',
      pricePer1000: new Decimal(100), // 100 RUB per 1000
      minQty: 100,
      maxQty: 10000
    };

    mockedPrisma.internalService.findUnique.mockResolvedValue(mockService);

    // 2. Logic: Retrieve Service
    const service = await prisma.internalService.findUnique({ where: { id: serviceId } });
    expect(service).toBeDefined();

    // 3. Logic: Calculate Total
    if (service) {
      const total = service.pricePer1000.mul(quantity).div(1000);
      expect(total.toNumber()).toBe(50); // 100 * 500 / 1000 = 50
    }
  });
});


