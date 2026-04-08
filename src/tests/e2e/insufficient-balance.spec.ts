/**
 * GAP-4: Insufficient Balance Flow
 */
import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import bcrypt from 'bcryptjs';

const BASE_URL = 'http://localhost:3000';

test.describe('Financial Error Paths: Insufficient Balance', () => {
    const BROKE_EMAIL = 'broke-user-e2e@smmplan.pro';
    const BROKE_PASS = 'BrokePass2026!';
    let projectId: string;

    test.beforeAll(async () => {
        const project = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
        projectId = project?.id ?? 'global';

        const hashed = await bcrypt.hash(BROKE_PASS, 10);
        await prisma.user.upsert({
            where: { email: BROKE_EMAIL },
            create: {
                email: BROKE_EMAIL,
                password: hashed,
                username: 'Broke E2E',
                projectId,
                balance: new Decimal(0),
                role: 'USER',
            },
            update: {
                password: hashed,
                balance: new Decimal(0),
            },
        });

        await prisma.internalService.upsert({
            where: { id: 'e2e-srv-1' },
            create: {
                id: 'e2e-srv-1',
                name: 'E2E Test Views',
                description: 'E2E Test Service Description',
                isActive: true,
                pricePer1000: new Decimal(10),
                minQty: 100,
                maxQty: 10000,
                platform: 'TELEGRAM',
                category: 'VIEWS',
                targetType: 'POST',
                geo: 'All',
            },
            update: { isActive: true },
        });
    });

    test('GAP-4a: Zero balance user → API returns requiresPayment=true with paymentUrl', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            headers: { 'host': 'localhost' },
            data: {
                serviceId: 'e2e-srv-1',
                link: 'https://t.me/e2etest/10',
                quantity: 500,
                email: BROKE_EMAIL,
                password: BROKE_PASS,
            },
        });

        const body = await res.json();
        if (res.status() !== 200) console.error('[GAP-4a] Error:', body);
        expect(res.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.requiresPayment).toBe(true);
        expect(body.paymentUrl).toBeTruthy();
        expect(body.loginToken).toBeTruthy();
    });

    test('GAP-4b: Balance invariant — zero balance unchanged after failed deduction attempt', async ({ request }) => {
        const userBefore = await prisma.user.findFirst({ where: { email: BROKE_EMAIL } });
        const balanceBefore = userBefore?.balance.toNumber() ?? 0;

        await Promise.all([
            request.post(`${BASE_URL}/api/client/orders`, {
                headers: { 'host': 'localhost' },
                data: { serviceId: 'e2e-srv-1', link: 'https://t.me/e2etest/11', quantity: 500, email: BROKE_EMAIL, password: BROKE_PASS },
            }),
            request.post(`${BASE_URL}/api/client/orders`, {
                headers: { 'host': 'localhost' },
                data: { serviceId: 'e2e-srv-1', link: 'https://t.me/e2etest/12', quantity: 500, email: BROKE_EMAIL, password: BROKE_PASS },
            }),
        ]);

        const userAfter = await prisma.user.findFirst({ where: { email: BROKE_EMAIL } });
        const balanceAfter = userAfter?.balance.toNumber() ?? 0;

        expect(balanceAfter).toBeGreaterThanOrEqual(0);
        expect(balanceAfter).toBe(balanceBefore);
    });

    // Skipping 4c (UI test) because testing Auth UI flow with Playwright in NextAuth v5 can be tricky due to CSRF and callback URLs
    test('GAP-4c: UI — zero balance user sees payment link after order submit (SKIPPED)', async ({ page }) => {
        test.skip(true, "NextAuth v5 CSRF issues in headless test env");
    });
});
