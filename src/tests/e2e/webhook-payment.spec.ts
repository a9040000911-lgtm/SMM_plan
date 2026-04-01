import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { ConfigService } from '@/services/core/config.service';

const MOCK_WEBHOOK_PAYLOAD = {
  type: "notification",
  event: "payment.succeeded",
  object: {
    id: "22d6d597-000f-5000-9000-145f6df21d6f",
    status: "succeeded",
    amount: { value: "200.00", currency: "RUB" },
    description: "Mock Webhook Payment",
    recipient: { account_id: "100500", gateway_id: "100500" },
    payment_method: { type: "bank_card", id: "22d6d597-000f-5000-9000-145f6df21d6f", saved: false },
    created_at: new Date().toISOString(),
    test: true
  }
};

test.describe('Payment Webhook Idempotency & Security (YooKassa)', () => {
    let testUserId: string;
    let testTxId: string;
    let paymentExternalId: string;

    test.beforeAll(async () => {
        // Prepare User
        const defaultProject = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
        const projectId = defaultProject ? defaultProject.id : 'global';

        const user = await prisma.user.upsert({
            where: { email: 'e2e-webhook@smmplan.pro' },
            create: {
                projectId,
                email: 'e2e-webhook@smmplan.pro',
                username: 'E2E Webhook User',
                password: 'abc', // doesn't matter
                balance: new Decimal(0),
                role: 'USER'
            },
            update: {
                balance: new Decimal(0), // Reset balance to 0
            }
        });
        testUserId = user.id;
        paymentExternalId = `pm_sim_${Date.now()}`;

        // Create a PENDING transaction simulating a user initiating a Deposit
        const tx = await prisma.transaction.create({
            data: {
                projectId,
                userId: testUserId,
                amount: new Decimal(1000), // 1000 RUB deposit
                type: 'DEPOSIT',
                status: 'PENDING',
                provider: 'YOOKASSA',
                externalId: paymentExternalId,
                metadata: { customField: 'E2E' }
            }
        });
        testTxId = tx.id;
    });

    test.afterAll(async () => {
        // Cleanup test data
        await prisma.transaction.deleteMany({ where: { userId: testUserId } });
        await prisma.order.deleteMany({ where: { userId: testUserId } });
        await prisma.ledgerEntry.deleteMany({ where: { userId: testUserId } });
        await prisma.organizationLedgerEntry.deleteMany({ where: { description: { contains: 'Simulation' } } });
        await prisma.user.delete({ where: { id: testUserId } });
    });

    test('Should block webhook originating from non-whitelisted IP', async ({ request }) => {
        const payload = { ...MOCK_WEBHOOK_PAYLOAD };
        payload.object.id = paymentExternalId;

        // Note: x-forwarded-for will simulate the originating IP unless x-debug-simulator=true is passed
        const response = await request.post('/api/webhooks/yookassa', {
            data: payload,
            headers: {
                'x-forwarded-for': '123.45.67.89' // Completely invalid IP
            }
        });

        // The webhook logic block unauthorized IPs and returns 403 Forbidden
        expect(response.status()).toBe(403);
    });

    test('Should reliably process a simulated valid webhook and increment balance ONLY ONCE despite Race Condition (Double-Spend Attack)', async ({ request }) => {
        const payload = { ...MOCK_WEBHOOK_PAYLOAD };
        payload.object.id = paymentExternalId;

        // Perform a Race Condition Attack: sending 10 simultaneous webhook notifications 
        // that claim the payment succeeded.
        const concurrentRequests = Array(10).fill(null).map(() => 
            request.post('/api/webhooks/yookassa', {
                data: payload,
                headers: {
                    // Send magic debug flag to skip IP whitelisting AND real YooKassa API verification
                    'x-debug-simulator': 'true',
                    // The backend in Dev environment will honor this and let it hit confirmPayment()
                }
            })
        );

        // Execute all 10 simultaneously
        const responses = await Promise.all(concurrentRequests);
        
        // At least one should be ok (or all depending on Next.js handling, but the backend logically processes it)
        const okResponses = responses.filter(r => r.status() === 200);
        expect(okResponses.length).toBeGreaterThan(0);

        // Wait a small buffer for async event buses (if any) to settle
        await new Promise(res => setTimeout(res, 500));

        // VERIFY IDEMPOTENCY: Query the user. His balance should increase exactly by 1000
        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(user!.balance.toNumber()).toBe(1000); // Because it started at 0

        // VERIFY TRANSACTION: Status must be COMPLETED
        const tx = await prisma.transaction.findUnique({ where: { id: testTxId } });
        expect(tx!.status).toBe('COMPLETED');
    });

});
