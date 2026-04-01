import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import bcrypt from 'bcryptjs';

test.describe('Checkout Flow (User Journey)', () => {
    let testUserId: string;

    test.beforeAll(async () => {
        // Prepare User
        const hashedPassword = await bcrypt.hash('E2ePassw0rd!', 10);
        const defaultProject = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
        const projectId = defaultProject ? defaultProject.id : 'global';

        const user = await prisma.user.upsert({
            where: { email: 'e2e-checkout@smmplan.pro' },
            create: {
                projectId: projectId,
                email: 'e2e-checkout@smmplan.pro',
                username: 'E2E Checkout',
                password: hashedPassword,
                balance: new Decimal(5000), // Enough balance
                role: 'USER',
                isGlobalAdmin: true,
            },
            update: {
                password: hashedPassword,
                balance: new Decimal(5000),
                isGlobalAdmin: true,
                projectId: projectId
            }
        });
        testUserId = user.id;

        // Ensure an active service
        await prisma.internalService.upsert({
            where: { id: 'e2e-srv-1' },
            create: {
                id: 'e2e-srv-1',
                name: 'E2E Test Views',
                description: 'E2E Test Service Description',
                isActive: true,
                pricePer1000: new Decimal(10), // Per 1000
                minQty: 100,
                maxQty: 10000,
                platform: 'TELEGRAM',
                category: 'VIEWS',
                targetType: 'POST',
                geo: 'All'
            },
            update: {
                isActive: true
            }
        });
    });

    test('User navigates catalog, fills link, and successfully purchases', async ({ page }) => {
        // 1. Авторизуемся через форму логина
        await page.goto('/login');
        await page.locator('input[type="email"], input[name="email"]').first().fill('e2e-checkout@smmplan.pro');
        await page.locator('input[type="password"], input[name="password"]').first().fill('E2ePassw0rd!');
        await page.waitForTimeout(500); // Wait for react state
        await Promise.all([
            page.waitForURL(/.*catalog.*/, { timeout: 10000 }).catch(() => null),
            page.locator('button[type="submit"]').first().click()
        ]);

        // 2. Идем в каталог
        await page.goto('/catalog');
        await expect(page.locator('button:has-text("Telegram")').first()).toBeVisible({ timeout: 15000 });

        // 3. Выбираем платформу Telegram
        await page.locator('button', { hasText: 'Telegram' }).click();

        // 4. Ищем кнопку Заказать у первой услуги
        const orderButton = page.locator('button', { hasText: 'Заказать' }).first();
        await expect(orderButton).toBeVisible();
        await orderButton.click();

        // 5. Ожидаем появление интерфейса оформления заказа (Модалка или переход на главную)
        await expect(page.locator('input[type="url"], input[name="link"]')).toBeVisible({ timeout: 15000 });

        // 6. Вводим ссылку
        await page.fill('input[type="url"], input[name="link"]', 'https://t.me/e2etest/1');

        // 7. Вводим количество
        const qtyInput = page.locator('input[name="quantity"], input[type="number"]');
        await qtyInput.fill('500');

        // Проверяем, что Нейро-UX пересчитал цену
        await expect(page.locator('text=/Итого к оплате|Оплатить/')).toContainText('5.00', { timeout: 5000 });

        // 8. Жмем купить
        await page.locator('button:has-text("Купить"), button:has-text("Оплатить"), button:has-text("Создать заказ")').click();

        // 9. Ожидаем успешного создания заказа
        await expect(page.locator('text=/успешно|Success|в работе/i')).toBeVisible({ timeout: 15000 });

        // 10. Проверяем баланс в БД
        const updatedUser = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(updatedUser?.balance.toNumber()).toBeLessThan(5000);
    });
});
