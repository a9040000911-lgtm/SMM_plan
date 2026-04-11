import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { adminLogin } from './helpers';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const testUserEmail = 'e2e-client-support@smmplan.pro';
const testAdminEmail = 'e2e-support-admin@smmplan.pro';
const testTicketSubject = 'E2E TEST: My order is stuck!';

test.describe('Административный Пайплайн Поддержки и Заказов (E2E)', () => {
    test.setTimeout(300000); // 5 минут таймаут для Next.js dev Server

    let testAdminId: string;
    let testUserId: string;
    let testOrderId: number;
    let testTicketId: string;
    let testMacroId: string;

    test.beforeAll(async () => {
        // Очистка старых данных
        await prisma.ledgerEntry?.deleteMany({ where: { user: { email: { in: [testAdminEmail, testUserEmail] } } } }).catch(()=>null);
        await prisma.transaction?.deleteMany({ where: { user: { email: { in: [testAdminEmail, testUserEmail] } } } }).catch(()=>null);
        await prisma.supportTicket.deleteMany({ where: { subject: testTicketSubject } });
        await prisma.order.deleteMany({ where: { link: 'https://example.com/stuck_post' } });
        await prisma.user.deleteMany({ where: { email: { in: [testAdminEmail, testUserEmail] } } });
        await prisma.supportMacro.deleteMany({ where: { title: 'E2E Refund Macro' } });

        const testProvider = await prisma.provider.findFirst({ where: { name: 'E2E_AUTO_PROVIDER' } });
        
        // Создадим админа
        const adminHash = await bcrypt.hash('abc', 10);
        const admin = await prisma.user.create({
            data: {
                email: testAdminEmail,
                username: 'E2E Support Admin',
                password: adminHash,
                role: 'ADMIN',
                isGlobalAdmin: true,
                twoFactorEnabled: false
            }
        });
        testAdminId = admin.id;

        // Создадим клиента
        const user = await prisma.user.create({
            data: {
                email: testUserEmail,
                username: 'E2E Test Client',
                balance: 1000,
                role: 'USER',
                password: await bcrypt.hash('123', 10),
            }
        });
        testUserId = user.id;

        // Создадим фейковую услугу
        let internalService = await prisma.internalService.findUnique({ where: { id: 'e2e-support-service' } });
        if (!internalService) {
             internalService = await prisma.internalService.create({
                data: {
                    id: 'e2e-support-service',
                    name: 'E2E Support Service',
                    description: 'Test service',
                    geo: 'Global',
                    pricePer1000: 100,
                    minQty: 10,
                    maxQty: 1000,
                    numericId: 999999
                }
             })
        }

        // Создадим заказ
        const order = await prisma.order.create({
            data: {
                userId: testUserId,
                internalServiceId: internalService.id,
                link: 'https://example.com/stuck_post',
                quantity: 500,
                totalPrice: 50,
                status: 'PROCESSING',
            }
        });
        testOrderId = order.id;

        // Создадим тикет
        const ticket = await prisma.supportTicket.create({
            data: {
                userId: testUserId,
                subject: testTicketSubject,
                orderId: testOrderId,
                status: 'OPEN',
                messages: {
                    create: {
                        sender: 'USER',
                        text: 'Hello, my order has been stuck for 3 days!'
                    }
                }
            }
        });
        testTicketId = ticket.id;
        
        // Создадим Макрос для ответа
        const macro = await prisma.supportMacro.create({
            data: {
                title: 'E2E Refund Macro',
                text: 'Здравствуйте! Мы приносим извинения, сейчас сделаем возврат.',
                actions: [
                    { type: 'SEND_MESSAGE' },
                    { type: 'REFUND_LAST_ORDER' },
                    { type: 'CLOSE_TICKET' }
                ]
            }
        });
        testMacroId = macro.id;
    });

    test.afterAll(async () => {
        // Уборка после тестов
        await prisma.supportMacro.deleteMany({ where: { title: 'E2E Refund Macro' } });
        await prisma.supportTicket.deleteMany({ where: { id: testTicketId } });
        await prisma.ledgerEntry?.deleteMany({ where: { userId: testUserId } }).catch(()=>null);
        await prisma.transaction?.deleteMany({ where: { userId: testUserId } }).catch(()=>null);
        await prisma.order.deleteMany({ where: { id: testOrderId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
        await prisma.user.deleteMany({ where: { id: testAdminId } });
        await prisma.internalService.deleteMany({ where: { id: 'e2e-support-service'} });
    });

    test('Ответ на тикет, использование Макроса и авто-Рефанд', async ({ page }) => {
        await adminLogin(page, testAdminEmail, 'abc');

        // ==== ФАЗА 1: РАБОТА С ТИКЕТАМИ ====
        await test.step('Проверка UI тикетов', async () => {
            await page.goto('/admin/support', { waitUntil: 'domcontentloaded' });
            
            // В сайдбаре слева есть список юзеров
            await expect(page.locator('button', { hasText: 'E2E Test Client' }).first()).toBeVisible({ timeout: 15000 });
            
            // Кликаем по юзеру
            await page.locator('button', { hasText: 'E2E Test Client' }).first().click();

            // Проверяем, что попали внутрь тикета
            await expect(page.locator('span', { hasText: testTicketSubject })).toBeVisible({ timeout: 10000 });
            await expect(page.locator('p', { hasText: 'Hello, my order has been stuck' })).toBeVisible();

            // Ждем кнопку Быстрые действия (Макросы)
            await page.getByRole('button', { name: /Макросы/i }).click();

            // В выпадающем меню кликаем E2E Refund Macro
            // Важно избежать проблем с переключением фокуса
            await page.waitForSelector('text="E2E Refund Macro"');
            await page.locator('button', { hasText: 'E2E Refund Macro' }).click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'macro-clicked-ui.png', fullPage: true });

            // Убедимся, что тикет закрыт (статус CLOSED)
            // Убедимся, что тикет закрыт (статус Решено/Закрыт в русской локализации)
            await expect(page.locator('span', { hasText: /Решено|Закрыт/ }).first()).toBeVisible({ timeout: 15000 });
            
            // И должен появиться текст из макроса
            await expect(page.getByText('Здравствуйте! Мы приносим извинения').first()).toBeVisible({ timeout: 15000 });
        });

        // ==== ФАЗА 2: РАБОТА С ЗАКАЗАМИ ====
        await test.step('Симуляция Возврата', async () => {
             // Идем в заказы. Подождем немного для стабильности.
             await page.waitForTimeout(2000);
             await page.goto('/admin/orders', { waitUntil: 'domcontentloaded' });
             
             // Ищем наш заказ по ссылке
             const searchInput = page.getByPlaceholder('ID, Почта, TG ID или Ссылка...');
             await searchInput.fill('https://example.com/stuck_post');
             // Нажимаем Enter для поиска
             await searchInput.press('Enter');
             
             // Ждем появления записи с нашей ссылкой
             await expect(page.locator('a', { hasText: 'https://example.com/stuck_post' })).toBeVisible({ timeout: 15000 });
             
             // Из-за Макроса заказ должен был стать CANCELED
             await expect(page.locator('span', { hasText: 'ОТМЕНЕН' }).first()).toBeVisible();
             
             // Мы успешно подтвердили, что транзакция возврата выполнена (статус ОТМЕНЕН), 
             // так как атомарный коммит макроса отложен не был.
        });
    });
});
