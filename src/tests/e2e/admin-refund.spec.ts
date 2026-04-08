import { test, expect } from '@playwright/test';
import { adminLogin } from './helpers';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import bcrypt from 'bcryptjs';

test.describe('Admin Flow (Manual Refund)', () => {
    let orderId: number;

    test.beforeAll(async () => {
        const user = await prisma.user.upsert({
            where: { email: 'e2e-refund@smmplan.pro' },
            create: { projectId: 'global', email: 'e2e-refund@smmplan.pro', username: 'Refund User', balance: new Decimal(100), role: 'USER' },
            update: {}
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
                geo: 'All'
            },
            update: {}
        });

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                projectId: 'global',
                internalServiceId: 'e2e-srv-1', // created by checkout-flow
                link: 'https://test.com',
                quantity: 1000,
                totalPrice: new Decimal(20),
                costPrice: new Decimal(15),
                status: 'IN_PROGRESS',
            }
        });
        orderId = order.id;

        // Admin
        const hashedPassword = await bcrypt.hash('E2ePassw0rd!', 10);
        await prisma.user.upsert({
            where: { email: 'admin-e2e@smmplan.pro' },
            create: {
                email: 'admin-e2e@smmplan.pro',
                role: 'ADMIN',
                password: hashedPassword,
                isGlobalAdmin: true,
                twoFactorEnabled: false
            },
            update: {
                password: hashedPassword,
                isGlobalAdmin: true
            }
        });
    });

    test('Admin logs in and refunds the order', async ({ page }) => {
        // 1. Авторизация через admin login
        await adminLogin(page, 'admin-e2e@smmplan.pro', 'E2ePassw0rd!');

        // 2. Ждем дашборд (Admin)
        await page.goto('/admin');
        await expect(page.locator('text=/Панель управления|Dashboard|Обзор/i')).toBeVisible({ timeout: 15000 });

        // 3. Идем в заказы
        await page.goto('/admin/orders');
        
        // 4. Ищем наш заказ и открываем модалку
        // Используем поиск по ID
        await page.fill('input[placeholder*="Поиск"]', orderId.toString());
        await page.waitForTimeout(1000); // Debounce
        
        const orderRow = page.locator(`tr`, { hasText: orderId.toString() }).first();
        await orderRow.click();
        
        // 5. В модалке находим кнопку Refund
        const refundButton = page.locator('button:has-text("Manual Refund"), button:has-text("Возврат")').first();
        await refundButton.click();

        // Модалка подтверждения
        await page.locator('button:has-text("Confirm")').click();

        // 6. Ожидаем успешного Toast
        await expect(page.locator('text=/Успешный возврат|Refunded/i')).toBeVisible({ timeout: 10000 });

        // 7. Проверим БД, что баланс вернулся
        const user = await prisma.user.findUnique({ where: { email: 'e2e-refund@smmplan.pro' } });
        expect(user?.balance.toNumber()).toBe(120); // 100 original + 20 refund
    });
});
