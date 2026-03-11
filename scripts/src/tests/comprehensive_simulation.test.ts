/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { PrismaClient, User, InternalService, Provider } from '@/generated/client';
import { SafetyService } from '@/services/users';
import { ProviderService } from '@/services/providers';
import { Decimal } from 'decimal.js';

// Set long timeout for simulation
jest.setTimeout(30000);

// Mock ProviderService and Bot to avoid real API calls and background tasks
jest.mock('@/services/providers');
jest.mock('@/lib/bot', () => ({
  bot: {
    telegram: {
      sendMessage: jest.fn().mockResolvedValue({})
    },
    launch: jest.fn(),
    stop: jest.fn()
  }
}));

const prisma = new PrismaClient();

describe('Comprehensive Business Logic Simulation', () => {
  let testUser: User;
  let testService: InternalService;
  let testProvider: Provider;

  beforeAll(async () => {
    // 0. Create Project
    await prisma.project.upsert({
      where: { slug: 'global' },
      update: {},
      create: {
        id: 'global',
        slug: 'global',
        domain: 'global.smmplan.com',
        name: 'Global Project'
      }
    });

    // 1. Create a Test User
    testUser = await prisma.user.upsert({
      where: { tgId: 999999999n },
      update: { balance: new Decimal(100000), spent: new Decimal(0) },
      create: {
        projectId: 'global',
        tgId: 999999999n,
        username: 'SimulationUser',
        balance: new Decimal(100000),
        role: 'USER'
      }
    });

    // 2. Create Provider & Balance Log to pass processPendingOrders checks
    let provider = await prisma.provider.findFirst({
      where: { name: 'vexboost', projectId: null }
    });

    if (!provider) {
      provider = await prisma.provider.create({
        data: {
          name: 'vexboost',
          type: 'universal',
          apiUrl: 'http://test-provider.local/api/v2',
          apiKey: 'test-api-key',
          balanceThreshold: 50.0,
          projectId: null
        }
      });
    }
    testProvider = provider;

    await prisma.providerBalanceLog.create({
      data: {
        providerId: testProvider.id,
        balance: new Decimal(5000)
      }
    });

    // 3. Setup Provider Service and Service
    const serviceId = 'TEST_SERVICE_SIMULATION';

    await prisma.providerService.deleteMany({
      where: { id: "100", providerId: testProvider.id }
    });

    await prisma.providerService.create({
      data: {
        id: "100",
        providerId: testProvider.id,
        name: 'Test Provider Service',
        rawPrice: new Decimal(10),
        rawData: {},
        externalId: "ext-100",
        dataHash: "hash-100"
      }
    });

    testService = await prisma.internalService.upsert({
      where: { id: serviceId },
      update: { isActive: true, pricePer1000: new Decimal(100), geo: 'RU' },
      create: {
        id: serviceId,
        name: 'Test Service Simulation',
        description: 'For testing only',
        pricePer1000: new Decimal(100),
        minQty: 10,
        maxQty: 1000,
        platform: 'TELEGRAM',
        category: 'VIEWS',
        geo: 'RU',
        targetType: 'POST'
      },
      include: { providerMappings: true }
    });

    await prisma.internalServiceMapping.deleteMany({
      where: {
        internalServiceId: serviceId,
        providerServiceId: "100",
        providerId: testProvider.id
      }
    });

    await prisma.internalServiceMapping.create({
      data: {
        internalServiceId: serviceId,
        providerServiceId: "100",
        providerId: testProvider.id,
        priority: 1,
        isActive: true
      }
    });

    // Refresh testService with mappings
    testService = (await prisma.internalService.findUnique({
      where: { id: serviceId },
      include: { providerMappings: true }
    }))!;
  });

  afterAll(async () => {
    // Cleanup
    if (testUser) {
      await prisma.order.deleteMany({ where: { userId: testUser.id } });
      await prisma.transaction.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });
    }
    if (testProvider) {
      await prisma.providerBalanceLog.deleteMany({ where: { providerId: testProvider.id } });
    }
    if (testService) {
      await prisma.internalServiceMapping.deleteMany({ where: { internalServiceId: testService.id } });
      await prisma.internalService.delete({ where: { id: testService.id } }).catch(() => { });
    }
    await prisma.$disconnect();
  });

  // --- SCENARIO 1: NORMAL ORDER ---
  test('Scenario 1: Standard Order Processing (Success)', async () => {
    const qty = 100;
    const link = 'https://t.me/test_post/1';
    const cost = testService.pricePer1000.mul(qty).div(1000); // 100 * 100 / 1000 = 10 RUB

    // Mock Safety Check to pass
    jest.spyOn(SafetyService, 'validateOrder').mockResolvedValue({ valid: true });

    // Simulate Order Creation Transaction (mimicking bot logic)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: testUser.id } });
      if (user!.balance.lt(cost)) throw new Error('Balance too low');

      const order = await tx.order.create({
        data: {
          userId: user!.id,
          internalServiceId: testService.id,
          link: link,
          quantity: qty,
          totalPrice: cost,
          providerName: 'vexboost',
          status: 'PENDING'
        }
      });

      await tx.user.update({
        where: { id: user!.id },
        data: { balance: { decrement: cost }, spent: { increment: cost } }
      });

      return order;
    });

    expect(result).toBeDefined();
    expect(result.status).toBe('PENDING');

    // Verify Balance Deduction
    const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    expect(updatedUser?.balance.toNumber()).toBeCloseTo(100000 - 10);
  });

  // --- SCENARIO 2: MARGIN GUARD TRIGGER (Price Spike) ---
  test('Scenario 2: Margin Guard triggers when provider price spikes', async () => {

    // 1. Mock Provider Service to return an EXTREMELY HIGH price (500 RUB per 1000)
    // Our service price is 100 RUB.
    // Even with 0% markup, 500 > 100, so it should trigger.
    (ProviderService.getProviderServices as jest.Mock).mockResolvedValue([
      { service: '100', rate: '500.00' }
    ]);

    // Restore validateOrder to original implementation (remove mock from test 1)
    // We search for the spy in the test 1 and restore it here if needed, 
    // but better to just restore everything EXCEPT the bot.
    // However, since bot is a jest.mock, restoreAllMocks SHOULD NOT affect it 
    // UNLESS it's a spy. But let's be safe.

    // In Scenario 1 we did: jest.spyOn(SafetyService, 'validateOrder').mockResolvedValue({ valid: true });
    // So we just need to find that spy and restore it.
    const spy = jest.spyOn(SafetyService, 'validateOrder');
    spy.mockRestore();

    // Re-apply ProviderService mock just in case
    (ProviderService.getProviderServices as jest.Mock).mockResolvedValue([
      { service: '100', rate: '500.00' }
    ]);

    // Now call validateOrder
    const check = await SafetyService.validateOrder(testService.id, 100, 'global');

    expect(check.valid).toBe(false);
    expect(check.reason).toMatch(/Технические работы|Technical works/);

    // Verify Service is now disabled
    const svc = await prisma.internalService.findUnique({ where: { id: testService.id } });
    expect(svc?.isActive).toBe(false);
  });

  // --- SCENARIO 3: DUPLICATE ORDERS ---
  test('Scenario 3: Duplicate Orders to same link', async () => {
    // Re-enable service for this test
    await prisma.internalService.update({ where: { id: testService.id }, data: { isActive: true } });

    const link = 'https://t.me/duplicate_test/1';

    // Create Order 1
    const order1 = await prisma.order.create({
      data: {
        userId: testUser.id,
        internalServiceId: testService.id,
        link: link,
        quantity: 100,
        totalPrice: new Decimal(10),
        providerName: 'vexboost',
        status: 'PENDING'
      }
    });

    // Create Order 2 (Immediate duplicate)
    const order2 = await prisma.order.create({
      data: {
        userId: testUser.id,
        internalServiceId: testService.id,
        link: link,
        quantity: 100,
        totalPrice: new Decimal(10),
        providerName: 'vexboost',
        status: 'PENDING'
      }
    });

    // System allows creation (bot layer handles warning, but DB layer allows it)
    // We verify they both exist and have different IDs
    expect(order1.id).not.toBe(order2.id);
    expect(order1.link).toBe(order2.link);
  });

});
