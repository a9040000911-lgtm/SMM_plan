import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { OrderRefundService } from '@/services/orders/order-refund.service';

test.describe('Provider Sync & Idempotent Refunds', () => {
    let testUserId: string;
    let testOrderId: number;
    let testProjectId: string;

    test.beforeAll(async () => {
        // Prepare User
        const defaultProject = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
        testProjectId = defaultProject ? defaultProject.id : 'global';

        const user = await prisma.user.upsert({
            where: { email: 'e2e-sync@smmplan.pro' },
            create: {
                projectId: testProjectId,
                email: 'e2e-sync@smmplan.pro',
                username: 'E2E Sync User',
                password: 'abc', // doesn't matter
                balance: new Decimal(0),
                role: 'USER'
            },
            update: {
                balance: new Decimal(0), // Reset balance to 0
            }
        });
        testUserId = user.id;

        // Dummy Internal Service 
        const service = await prisma.internalService.findFirst({ where: { isActive: true } });
        if (!service) throw new Error("Need at least 1 internal service for tests.");

        // Create an IN_PROGRESS order reflecting a provider operation that cost 500 RUB
        const order = await prisma.order.create({
            data: {
                projectId: testProjectId,
                userId: testUserId,
                internalServiceId: service.id,
                link: 'https://t.me/test_sync',
                quantity: 1000,
                totalPrice: new Decimal(500), 
                status: 'IN_PROGRESS',
                externalId: `sim_prov_${Date.now()}`
            }
        });
        testOrderId = order.id;
    });

    test.afterAll(async () => {
        // Cleanup test data
        await prisma.transaction.deleteMany({ where: { userId: testUserId } });
        await prisma.organizationLedgerEntry.deleteMany({ where: { description: { contains: 'Simulation' } } });
        await prisma.order.deleteMany({ where: { userId: testUserId } });
        await prisma.ledgerEntry.deleteMany({ where: { userId: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
    });

    // We can directly test the service's private processing logic by targeting the mapped wrapper.
    // OrderSyncService exposes processSyncResult via its class if we simulate provider response.

    test('Should reliably process a CANCELED provider status and refund the DB balance exactly once (Race Condition Check)', async () => {
        const orderBefore = await prisma.order.findUnique({ where: { id: testOrderId }, include: { user: true } });
        const userBalanceBefore = orderBefore!.user.balance.toNumber();

        const fakeProviderData = {
            status: "canceled",
            remains: 1000 // All 1000 unfulfilled
        };
        
        // Simulating the SyncWorker executing the synchronization 10 times in parallel millisecond-perfect
        // E.g., two instances of bullmq process the same job or user clicks "Check Status" rapidly.
        // processSyncResult is private, but it delegates to OrderRefundService for refunds. Let's attack that directly:
        
        const attackRefunds = Array(10).fill(null).map(() => 
            OrderRefundService.handleRefund(orderBefore as any, 'CANCELED', 1000, fakeProviderData)
        );

        await Promise.allSettled(attackRefunds);

        // Verification 1: Order must be marked as CANCELED
        const orderAfter = await prisma.order.findUnique({ where: { id: testOrderId }, include: { user: true } });
        expect(orderAfter!.status).toBe('CANCELED');
        
        // Verification 2: Balance must increase by EXACTLY 500 (the totalPrice of the order). Not 10x 500.
        expect(orderAfter!.user.balance.toNumber()).toBe(userBalanceBefore + 500);

        // Verification 3: RefundedAmount must equal 500.
        expect(orderAfter!.refundedAmount.toNumber()).toBe(500);
        
        // Verification 4: Ledger must only contain 1 specific REFUND transaction.
        const txs = await prisma.transaction.findMany({ where: { orderId: testOrderId, type: 'REFUND' } });
        expect(txs.length).toBe(1);
        expect(txs[0].amount.toNumber()).toBe(500);
    });

});
