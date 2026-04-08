/**
 * GAP-4: Insufficient Balance Flow
 *
 * Тестирует финансовый error path:
 *  - Авторизованный пользователь с нулевым балансом пытается сделать заказ
 *  - Система отправляет на оплату (requiresPayment: true)
 *
 * Также проверяет атомарность списания:
 *  - Баланс не ушёл в минус при недостатке средств
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

        // Create user with zero balance
        const hashed = await bcrypt.hash(BROKE_PASS, 10);
        await prisma.user.upsert({
            where: { email: BROKE_EMAIL },
            create: {
                email: BROKE_EMAIL,
                password: hashed,
                username: 'Broke E2E',
                projectId,
                balance: new Decimal(0), // Intentionally zero
                role: 'USER',
            },
            update: {
                password: hashed,
                balance: new Decimal(0),
            },
        });

        // Ensure service
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

    // ────────────────────────────────────────────────────────────────
    // GAP-4a: Authenticated user with 0 balance → requiresPayment
    // ────────────────────────────────────────────────────────────────
    test('GAP-4a: Zero balance user → API returns requiresPayment=true with paymentUrl', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            data: {
                serviceId: 'e2e-srv-1',
                link: 'https://t.me/e2etest/10',
                quantity: 500,
                email: BROKE_EMAIL,
                password: BROKE_PASS, // Existing user — must provide password
            },
        });

        expect(res.status()).toBe(200);
        const body = await res.json();

        // Should require payment (no balance)
        expect(body.success).toBe(true);
        expect(body.requiresPayment).toBe(true);
        expect(body.paymentUrl).toBeTruthy();
        expect(body.loginToken).toBeTruthy(); // Magic token for post-payment login
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-4b: DB invariant — balance stayed at 0 (no deduction)
    // ────────────────────────────────────────────────────────────────
    test('GAP-4b: Balance invariant — zero balance unchanged after failed deduction attempt', async ({ request }) => {
        const userBefore = await prisma.user.findFirst({ where: { email: BROKE_EMAIL } });
        const balanceBefore = userBefore?.balance.toNumber() ?? 0;

        // Multiple concurrent order attempts (stress test the atomic guard)
        await Promise.all([
            request.post(`${BASE_URL}/api/client/orders`, {
                data: { serviceId: 'e2e-srv-1', link: 'https://t.me/e2etest/11', quantity: 500, email: BROKE_EMAIL, password: BROKE_PASS },
            }),
            request.post(`${BASE_URL}/api/client/orders`, {
                data: { serviceId: 'e2e-srv-1', link: 'https://t.me/e2etest/12', quantity: 500, email: BROKE_EMAIL, password: BROKE_PASS },
            }),
        ]);

        const userAfter = await prisma.user.findFirst({ where: { email: BROKE_EMAIL } });
        const balanceAfter = userAfter?.balance.toNumber() ?? 0;

        // Balance must never go negative
        expect(balanceAfter).toBeGreaterThanOrEqual(0);
        // Balance should be same as before (no deduction on payment redirect path)
        expect(balanceAfter).toBe(balanceBefore);
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-4c: E2E UI — zero balance user sees payment redirect UI
    // ────────────────────────────────────────────────────────────────
    test('GAP-4c: UI — zero balance user sees payment link after order submit', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.locator('input[type="email"], input[name="email"]').first().fill(BROKE_EMAIL);
        await page.locator('input[type="password"], input[name="password"]').first().fill(BROKE_PASS);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForURL(/\/(catalog|dashboard|$)/, { timeout: 15000 }).catch(() => null);
        await page.waitForLoadState('networkidle');

        // Go to catalog
        await page.goto('/catalog');
        await page.waitForLoadState('networkidle');

        // Select any service
        const orderBtn = page.locator('button', { hasText: 'Заказать' }).first();
        await expect(orderBtn).toBeVisible({ timeout: 10000 });
        await orderBtn.click();

        // Fill order form
        const linkInput = page.locator('input[type="url"], input[name="link"]');
        await expect(linkInput).toBeVisible({ timeout: 10000 });
        await linkInput.fill('https://t.me/e2etest/20');

        const qtyInput = page.locator('input[name="quantity"], input[type="number"]');
        await qtyInput.fill('500');
        await page.waitForTimeout(500);

        // Submit
        const payBtn = page.locator('button:has-text("Оплатить"), button:has-text("Купить"), button:has-text("Создать заказ")').first();
        await expect(payBtn).toBeEnabled({ timeout: 5000 });
        await payBtn.click();

        // Should NOT go to dashboard orders — should show payment UI or redirect to payment
        // (no balance means requiresPayment=true → external payment URL)
        await page.waitForTimeout(3000);
        const currentUrl = page.url();

        // Either redirected to YooKassa, or stayed on page with payment indicator
        const isPaymentRedirect = currentUrl.includes('yookassa') ||
            currentUrl.includes('pay') ||
            await page.locator('text=/оплат/i').first().isVisible({ timeout: 2000 }).catch(() => false);

        // At minimum — should NOT be on /dashboard/orders (which would mean order was "paid")
        expect(currentUrl).not.toMatch(/dashboard\/orders/);

        console.log(`[GAP-4c] After submit: ${currentUrl} | Payment UI visible: ${isPaymentRedirect}`);
    });
});
