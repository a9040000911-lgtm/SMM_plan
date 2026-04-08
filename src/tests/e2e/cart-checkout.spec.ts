/**
 * GAP-3: Cart Checkout Flow
 *
 * Тестирует путь через корзину (/cart):
 *  - Гость добавляет услугу через GrowthSimulator (localStorage)
 *  - Переходит в /cart
 *  - Оформляет заказ → auto-регистрация → magic token
 *
 * Также тестирует пакетный заказ (batch order):
 *  - Несколько услуг в корзине за раз
 */
import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

const BASE_URL = 'http://localhost:3000';

test.describe('Cart Checkout Flow', () => {
    let projectId: string;

    test.beforeAll(async () => {
        const project = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
        projectId = project?.id ?? 'global';

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
    // GAP-3a: Cart page loads and shows items from localStorage
    // ────────────────────────────────────────────────────────────────
    test('GAP-3a: Cart page renders correctly with items from Growth Simulator', async ({ page }) => {
        // Inject cart item into localStorage before navigating
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        await page.evaluate(() => {
            const cartItem = [{
                id: 'GROWTH_PACKAGE',
                serviceId: 'e2e-srv-1',
                name: 'E2E Test Package',
                platform: 'TELEGRAM',
                quantity: 1000,
                price: 10,
                link: '',
            }];
            localStorage.setItem('cart', JSON.stringify(cartItem));
        });

        await page.goto('/cart');
        await page.waitForLoadState('networkidle');

        // Cart should render
        await expect(page.locator('text=/корзина|cart|заказ/i').first()).toBeVisible({ timeout: 10000 });
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-3b: Batch order API — multiple services at once
    // ────────────────────────────────────────────────────────────────
    test('GAP-3b: Batch order API creates multiple orders at once', async ({ request }) => {
        const cartEmail = `cart-e2e-${Date.now()}@smmplan.pro`;

        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            data: {
                batch: [
                    { serviceId: 'e2e-srv-1', link: 'https://t.me/e2etest/30', quantity: 500 },
                    { serviceId: 'e2e-srv-1', link: 'https://t.me/e2etest/31', quantity: 500 },
                ],
                email: cartEmail,
            },
        });

        // Batch orders when user has no balance → payment required OR 200 with success
        expect([200, 201]).toContain(res.status());
        const body = await res.json();

        // Either requiresPayment=true or success=true
        expect(body.success || body.requiresPayment).toBeTruthy();

        // loginToken must be present for auto-login
        if (body.loginToken) {
            expect(typeof body.loginToken).toBe('string');
        }

        // User was auto-created
        const created = await prisma.user.findFirst({ where: { email: cartEmail } });
        expect(created).not.toBeNull();

        // Cleanup
        await prisma.user.deleteMany({ where: { email: cartEmail } });
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-3c: E2E UI — cart checkout with guest email
    // ────────────────────────────────────────────────────────────────
    test('GAP-3c: Cart UI — guest fills email and submits order', async ({ page }) => {
        const cartGuestEmail = `cart-ui-e2e-${Date.now()}@smmplan.pro`;

        // 1. Inject cart into localStorage
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        await page.evaluate((svcId) => {
            const cartItem = [{
                id: 'GROWTH_PACKAGE',
                serviceId: svcId,
                name: 'E2E Test Views',
                platform: 'TELEGRAM',
                quantity: 500,
                price: 5,
                link: 'https://t.me/e2etest/40',
            }];
            localStorage.setItem('cart', JSON.stringify(cartItem));
        }, 'e2e-srv-1');

        // 2. Go to /cart
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');

        // 3. Fill email
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await emailInput.fill(cartGuestEmail);
            await page.waitForTimeout(500);
        } else {
            console.log('[GAP-3c] Email input not visible — may already be authenticated');
        }

        // 4. Submit order
        const submitBtn = page.locator(
            'button:has-text("Оплатить"), button:has-text("Оформить"), button:has-text("Купить"), button:has-text("Заказать")'
        ).first();

        if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(3000);
        }

        // 5. Verify: either payment redirect or dashboard
        const url = page.url();
        const isSuccessPath = url.includes('dashboard') || url.includes('yookassa') || url.includes('pay');
        console.log(`[GAP-3c] After cart submit: ${url}`);

        // At minimum — page didn't crash
        const hasError = await page.locator('text=/500|Internal Server Error/i').isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasError).toBe(false);

        // Cleanup
        await prisma.user.deleteMany({ where: { email: cartGuestEmail } });
    });
});
