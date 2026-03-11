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
import { ProviderService } from '../services/providers/provider.service';
import { ServiceSyncService } from '@/services/providers/sync.service';
import { OrderSyncService } from '@/services/orders/order-sync.service';
import { Decimal } from 'decimal.js';

// Set long timeout

// Set long timeout
jest.setTimeout(60000);

// Mock Provider Service
jest.mock('@/services/providers/provider.service');
// Mock Bot
jest.mock('@/lib/bot', () => ({
    bot: {
        telegram: {
            sendMessage: jest.fn().mockResolvedValue({})
        }
    }
}));

const prisma = new PrismaClient();

describe('E2E Full Cycle: Payment to Order Completion', () => {
    let user: User;
    let service: InternalService;
    let providerId: string;

    beforeAll(async () => {
        // 1. Setup Data
        const projectId = 'e2e_test_project_v3'; // Changed ID to avoid conflict
        await prisma.project.upsert({
            where: { slug: projectId },
            update: {},
            create: { id: projectId, slug: projectId, domain: 'e2e-v3.test', name: 'E2E Project V3' }
        });

        user = await prisma.user.create({
            data: {
                projectId,
                tgId: BigInt(Date.now() + Math.floor(Math.random() * 10000)), // Randomize to avoid Unique constraint
                username: `e2e_user_v3_${Date.now()} `,
                balance: 0,
                role: 'USER'
            }
        });

        const providerName = 'e2e_provider_v3';
        let provider = await prisma.provider.findFirst({ where: { name: providerName } });
        if (!provider) {
            provider = await prisma.provider.create({
                data: { name: providerName, type: 'vexboost', apiKey: 'test', apiUrl: 'http://test', isEnabled: true }
            });
        } else {
            await prisma.provider.update({ where: { id: provider.id }, data: { isEnabled: true } });
        }
        providerId = provider.id;

        // Create Service (Use upsert to avoid Unique failure)
        const serviceId = 'e2e_svc_v3';
        service = await prisma.internalService.upsert({
            where: { id: serviceId },
            update: {},
            create: {
                id: serviceId,
                name: 'E2E Test Service V3',
                description: 'E2E Test Description',
                pricePer1000: 100,
                minQty: 10,
                maxQty: 1000,
                platform: 'TELEGRAM',
                category: 'VIEWS',
                geo: 'RU'
            }
        });

        // Create Provider Service & Mapping (Using UUID)
        const providerService = await prisma.providerService.create({
            data: {
                providerId,
                externalId: '999',
                name: 'Ext Svc V3',
                rawPrice: 10,
                rawData: {},
                dataHash: 'hash_v3'
            }
        });

        const providerServiceId = providerService.id;

        await prisma.internalServiceMapping.create({
            data: {
                internalServiceId: service.id,
                providerId,
                providerServiceId: providerServiceId,
                priority: 1,
                isActive: true
            }
        });
        // Trigger Sync
        await ServiceSyncService.syncProvider(providerId); // Assuming providerAlpha.id refers to providerId

        // Mock ProviderService.createOrder success
        (ProviderService.createOrder as jest.Mock).mockResolvedValue({
            success: true,
            externalId: 'ext_v3_111',
            providerName: providerName,
            rawData: { order: 111 }
        });

        // Mock ProviderService.getOrderStatus
        (ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({
            status: 'Completed',
            remains: 0,
            cost: 0.1
        });

        // Mock ProviderService.getInstance for balance check (used in processor)
        (ProviderService.getInstance as jest.Mock).mockResolvedValue({
            getBalance: jest.fn().mockResolvedValue({ balance: 1000, currency: 'USD' }),
            createOrder: jest.fn().mockResolvedValue({ success: true, externalId: 'ext_v3_111', providerName }),
            getStatus: jest.fn().mockResolvedValue({ status: 'Completed', remains: 0 })
        });

        // Add Balance Log for optimization check
        await prisma.providerBalanceLog.create({
            data: { providerId, balance: 1000 }
        });
    });

    afterAll(async () => {
        // Cleanup
        if (user) {
            await prisma.ledgerEntry.deleteMany({ where: { userId: user.id } });
            await prisma.transaction.deleteMany({ where: { userId: user.id } });
            await prisma.order.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
        if (service) {
            await prisma.internalServiceMapping.deleteMany({ where: { internalServiceId: service.id } });
            await prisma.internalService.delete({ where: { id: service.id } });
        }
        // Cleanup Provider stuff
        await prisma.internalServiceMapping.deleteMany({ where: { providerId } }); // Force clean mappings
        await prisma.providerBalanceLog.deleteMany({ where: { providerId } });
        await prisma.providerService.deleteMany({ where: { providerId } });
        await prisma.provider.delete({ where: { id: providerId } });

        await prisma.$disconnect();
    });

    test('Should process Payment -> Create Order -> Send to Provider -> Sync Status', async () => {
        // 1. Create PENDING Transaction (Simulate YooKassa creation)
        const amount = 100; // Enough for 1000 qty (price 100)
        const tx = await prisma.transaction.create({
            data: {
                projectId: user.projectId,
                userId: user.id,
                amount: new Decimal(amount),
                type: 'DEPOSIT',
                provider: 'YOOKASSA',
                status: 'PENDING',
                externalId: 'pay_v3_123',
                metadata: {
                    serviceId: service.id,
                    qty: 1000,
                    link: 'http://test.com/post'
                }
            }
        });

        // 2. Confirm Payment (Trigger Webhook Logic)
        const confirmed = await confirmPayment(tx.externalId!);
        expect(confirmed).toBe(true);

        // Verify User Balance
        const userAfterPay = await prisma.user.findUnique({ where: { id: user.id } });
        expect(userAfterPay!.balance.toNumber()).toBe(0);

        // 3. Process Pending Orders (Cron Job Simulation)
        // We need to find the order ID first.
        const orderIndex = await prisma.order.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
        expect(orderIndex).toBeDefined();

        // Explicitly call process
        await processPendingOrders(orderIndex!.id);

        // Verify Order Sent to Provider
        const orderProcessing = await prisma.order.findUnique({ where: { id: orderIndex!.id } });
        expect(orderProcessing!.status).toBe('PROCESSING');
        expect(orderProcessing!.externalId).toBe('ext_v3_111');

        // Wait for worker or trigger sync manually for test purpose
        await OrderSyncService.syncAllActive([orderProcessing!.id]);

        // Verify Order Completed
        const orderCompleted = await prisma.order.findUnique({ where: { id: orderIndex!.id } });
        expect(orderCompleted!.status).toBe('COMPLETED');
        expect(orderCompleted!.remains).toBe(0);

        // 5. Verify Ledger
        const entries = await prisma.ledgerEntry.findMany({ where: { userId: user.id } });
        expect(entries.some(e => e.type === 'DEPOSIT')).toBe(true);
        expect(entries.some(e => e.type === 'WITHDRAWAL')).toBe(true);
    });
});
