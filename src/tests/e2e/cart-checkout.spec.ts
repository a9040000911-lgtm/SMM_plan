/**
 * GAP-3: Cart Checkout Flow
 */
import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

const BASE_URL = 'http://localhost:3000';

test.describe('Cart Checkout Flow', () => {
    let projectId: string;
    let serviceId: string;

    test.beforeAll(async () => {
        const project = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
        projectId = project?.id ?? 'global';

        const svc = await prisma.internalService.upsert({
            where: { id: 'e2e-srv-1' },
            create: {
                id: 'e2e-srv-1',
                name: 'E2E Test Views',
                description: 'E2E Test Service Description',
                isActive: true,
                pricePer1000: new Decimal(10),
                minQty: 100,
                maxQty: 10000,
                targetType: 'POST',
                geo: 'All',
            },
            update: { isActive: true },
        });
        serviceId = svc.id;
    });

    test('GAP-3b: Batch order API creates multiple orders at once', async ({ request }) => {
        const cartEmail = `cart-e2e-${Date.now()}@smmplan.pro`;

        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            headers: { 'host': 'localhost' },
            data: {
                batch: [
                    { serviceId, link: 'https://example.com/cart1', quantity: 500 },
                    { serviceId, link: 'https://example.com/cart2', quantity: 1000 },
                ],
                email: cartEmail,
            },
        });

        const text = await res.text();
        let body;
        try { body = JSON.parse(text); } catch (e) {
            console.error('[GAP-3b] Received HTML instead of JSON:', text.substring(0, 1000));
            throw e;
        }
        if (![200, 201].includes(res.status())) console.error('[GAP-3b] Error:', body);
        expect([200, 201]).toContain(res.status());

        const createdUser = await prisma.user.findFirst({ where: { email: cartEmail, projectId } });
        expect(createdUser).not.toBeNull();

        const dbOrders = await prisma.order.findMany({
            where: { userId: createdUser!.id },
        });
        expect(dbOrders.length).toBe(2);
        
        await prisma.transaction.deleteMany({ where: { userId: createdUser!.id } });
        await prisma.order.deleteMany({ where: { userId: createdUser!.id } });
        await prisma.user.deleteMany({ where: { email: cartEmail } });
    });
});
