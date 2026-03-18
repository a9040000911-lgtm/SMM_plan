/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * @jest-environment node
 */
import { PrismaClient, User, InternalService } from '@/generated/client';
import { confirmPayment, processPendingOrders } from '@/services/orders/order-processor.service';
import { ServiceRegistry } from '@/services/registry';
import { ProviderService } from '@/services/providers/provider.service';
import { OrderSyncService } from '@/services/orders/order-sync.service';
import { Decimal } from 'decimal.js';

// Set long timeout
jest.setTimeout(60000);

// Mock Provider Service (Must stay mocked)
jest.mock('@/services/providers/provider.service');

// Mock Bot (Must stay mocked)
jest.mock('@/services/bot/bot-registry', () => ({
    bot: {
        telegram: { sendMessage: jest.fn().mockResolvedValue({}) }
    },
    BotRegistry: {
        get: jest.fn().mockReturnValue({
            telegram: { sendMessage: jest.fn().mockResolvedValue({}) }
        })
    }
}));

const prisma = new PrismaClient();

describe('E2E Full Cycle: Payment to Order Completion', () => {
    let user: User;
    let service: InternalService;
    let providerId: string;

    beforeAll(async () => {
        // 1. Initialize Registry (Wires up Events)
        await ServiceRegistry.init();

        // 2. Clear Mock DB for freshness
        await prisma.user.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.settings.deleteMany({});
        await prisma.internalService.deleteMany({});
        await prisma.project.deleteMany({});

        // 3. Seed Mock Data
        const projectId = 'e2e_p1';
        const _project = await prisma.project.upsert({
            where: { id: projectId },
            update: {},
            create: { id: projectId, slug: 'e2e', name: 'E2E Project', domain: 'e2e.test' }
        });

        user = await prisma.user.create({
            data: {
                id: 'e2e_u1',
                projectId,
                tgId: BigInt(Date.now()),
                balance: 100,
                spent: 0,
                currency: 'RUB',
                role: 'USER'
            }
        });

        service = await prisma.internalService.create({
            data: {
                id: 'e2e_svc_v3',
                name: 'E2E Service',
                description: 'E2E Description',
                pricePer1000: 1.0,
                minQty: 100,
                maxQty: 10000,
                lastProviderPrice: new Decimal(0.5),
                isActive: true,
                platform: 'TELEGRAM',
                category: 'VIEWS',
                geo: 'RU'
            }
        });

        // Seed Pricing Rules
        await prisma.settings.create({
            data: {
                projectId: null,
                key: 'PRICING_LADDER',
                value: JSON.stringify([{ minSpent: 0, markup: 2.0 }])
            }
        });

        // Seed Provider
        const provider = await prisma.provider.create({
            data: { name: 'e2e_pv1', type: 'vexboost', apiKey: 'abc', apiUrl: 'http://api', isEnabled: true }
        });
        providerId = provider.id;

        // Seed Provider Service & Mapping
        const ps = await prisma.providerService.create({
            data: { providerId, externalId: '999', name: 'Ext Svc', rawPrice: 0.5, rawData: {}, dataHash: 'h1' }
        });

        await prisma.internalServiceMapping.create({
            data: { internalServiceId: service.id, providerId, providerServiceId: ps.id, priority: 1, isActive: true }
        });

        // Seed Provider Balance (Required for Queue)
        await prisma.providerBalanceLog.create({
            data: { providerId, balance: new Decimal(1000), currency: 'USD' }
        });

        // Mock Provider methods
        jest.spyOn(ProviderService, 'getInstance').mockImplementation(async () => ({
            createOrder: jest.fn().mockResolvedValue({ success: true, externalId: 'ext_1', providerName: 'e2e_pv1' }),
            getBalance: jest.fn().mockResolvedValue({ balance: 1000 }),
            getServices: jest.fn().mockResolvedValue([]),
            getStatus: jest.fn().mockResolvedValue({ status: 'COMPLETED', remains: 0 })
        } as any));
        jest.spyOn(ProviderService, 'getStatuses').mockResolvedValue({ 'ext_1': { status: 'COMPLETED', remains: 0 } as any });
        (ProviderService.createOrder as jest.Mock).mockResolvedValue({ success: true, externalId: 'ext_1', providerName: 'e2e_pv1' });
        (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({ status: 'COMPLETED', remains: 0 });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    test('Should process Payment -> Create Order -> Send to Provider -> Sync Status', async () => {
        // 1. Create PENDING Transaction
        const _tx = await prisma.transaction.create({
            data: {
                projectId: user.projectId,
                userId: user.id,
                amount: new Decimal(100),
                type: 'DEPOSIT',
                provider: 'YOOKASSA',
                status: 'PENDING',
                externalId: 'pay_1',
                metadata: {
                    serviceId: service.id,
                    qty: 1000,
                    link: 'http://t.me/test',
                    projectId: user.projectId
                }
            }
        });

        // 2. Confirm Payment (Triggers Orchestration)
        await confirmPayment('pay_1');

        // Wait for Async Orchestration
        await new Promise(r => setTimeout(r, 500));

        // 3. Verify Balance & Order Generation
        const userAfter = await prisma.user.findUnique({ where: { id: user.id } });
        expect(userAfter!.balance.toNumber()).toBeGreaterThanOrEqual(0);

        const orders = await prisma.order.findMany({ where: { userId: user.id } });
        expect(orders.length).toBe(1);
        const order = orders[0];
        expect(order.status).toBe('PENDING');
        expect(order.quantity).toBe(1000);

        // 4. Send to Provider (Simulation of Cron Job)
        await processPendingOrders();

        const orderAfterSend = await prisma.order.findUnique({ where: { id: order.id } });
        expect(orderAfterSend!.status).toBe('PROCESSING');
        expect(orderAfterSend!.externalId).toBe('ext_1');

        // 5. Sync Status
        await OrderSyncService.syncAllActive();
        
        const orderFinal = await prisma.order.findUnique({ where: { id: order.id } });
        expect(orderFinal!.status).toBe('COMPLETED');
    });
});


