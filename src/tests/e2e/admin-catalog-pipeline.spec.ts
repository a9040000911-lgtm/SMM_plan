import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { adminLogin } from './helpers';

test.describe('Административный Пайплайн Управления Каталогом (E2E)', () => {
    let testAdminId: string;
    const testProviderName = 'E2E_AUTO_PROVIDER';

    test.beforeAll(async () => {
        // Подготовка супер-админа
        const admin = await prisma.user.upsert({
            where: { email: 'e2e-catalog-admin@smmplan.pro' },
            create: {
                projectId: 'global',
                email: 'e2e-catalog-admin@smmplan.pro',
                username: 'E2E Catalog Admin',
                password: '$2b$10$tPMphnSsYZdidyyBNGVpGe7qsI/Tmdwrhee0N5mTT7R65LRgYN2sC', // hash for abc
                balance: new Decimal(0),
                role: 'ADMIN',
                twoFactorEnabled: false,
                isGlobalAdmin: true
            },
            update: {
                role: 'ADMIN',
                twoFactorEnabled: false,
                isGlobalAdmin: true
            }
        });
        testAdminId = admin.id;

        // Предварительная очистка тестовых данных (на случай если прошлый прогон упал)
        const testProvider = await prisma.provider.findFirst({ where: { name: testProviderName } });
        if (testProvider) {
            await prisma.internalService.deleteMany({ where: { description: { contains: 'E2E_AUTO_TEST' } } });
            await prisma.provider.delete({ where: { id: testProvider.id } });
        }
    });

    test.afterAll(async () => {
        // Уборка после тестов
        const testProvider = await prisma.provider.findFirst({ where: { name: testProviderName } });
        if (testProvider) {
            await prisma.providerService.deleteMany({ where: { providerId: testProvider.id } });
            await prisma.internalService.deleteMany({ where: { description: { contains: 'E2E_AUTO_TEST' } } });
            await prisma.provider.delete({ where: { id: testProvider.id } });
        }
        await prisma.user.delete({ where: { id: testAdminId } });
    });

    test('Полный цикл: Добавление провайдера -> Импорт услуг -> Изменение описания и управление', async ({ page }) => {
        test.setTimeout(300000); // 5 minutes for slow UI interactions and Next.js cold starts

        // 1. Авторизация
        await adminLogin(page, 'e2e-catalog-admin@smmplan.pro', 'abc');

        // ==== ФАЗА 1: СОЗДАНИЕ ПРОВАЙДЕРА ====
        await test.step('Добавление провайдера', async () => {
            await page.goto('/admin/providers', { waitUntil: 'domcontentloaded' });
            // Ждем кнопку добавления и кликаем
            try {
                await page.getByRole('button', { name: /Добавить провайдера/i }).waitFor({ state: 'visible', timeout: 5000 });
            } catch (e) {
                console.log("HTML Dump because button missing:");
                console.log(await page.content());
                throw e;
            }
            await page.getByRole('button', { name: /Добавить провайдера/i }).click();
            await expect(page.locator('h3', { hasText: 'Новый провайдер' })).toBeVisible();

            // Заполнение формы
            await page.getByPlaceholder('VEXBOOST').fill(testProviderName);
            await page.getByPlaceholder('https://...').fill('https://e2e.example.com/api');
            await page.getByPlaceholder('1000').fill('1000');
            await page.getByPlaceholder('xxxx-xxxx-xxxx').fill('test-encrypted-key-12345');
            
            // Сохранение
            const responsePromise = page.waitForResponse(r => r.url().includes('/admin/providers') && r.status() === 200, { timeout: 10000 }).catch(() => null);
            await page.locator('button[type="submit"]', { hasText: 'Сохранить' }).click();
            await responsePromise;

            // Проверка, что модалка закрылась и провайдер появился в таблице
            await expect(page.locator('table', { hasText: testProviderName })).toBeVisible();
        });


        // ==== ФАЗА 2: ИМПОРТ УСЛУГ ИЗ API ====
        await test.step('Импорт внешних услуг', async () => {
            // Перехватываем GET запрос к API, чтобы вернуть фейковый ответ
            // вместо реального обращения СГ к несуществующему https://e2e.example.com/api
            await page.route('**/api/admin/services/import*', async (route, request) => {
                if (request.method() === 'GET') {
                    // Возвращаем мок
                    await route.fulfill({
                        json: {
                            data: [{
                                id: '99991',
                                providerId: 'dummy-id',
                                providerName: testProviderName,
                                name: 'Telegram Subscribers (E2E Test)',
                                platform: 'telegram',
                                category: 'SUBSCRIBERS',
                                rawPrice: '15.50',
                                rawData: { min: 10, max: 5000, description: 'E2E_AUTO_TEST Original Description' }
                            }],
                            meta: { total: 1, totalPages: 1 }
                        }
                    });
                } else {
                    await route.continue();
                }
            });

            await page.goto('/admin/services/import');
            
            // Ждем загрузки таблицы с фейковым элементом
            await expect(page.locator('table', { hasText: 'Telegram Subscribers (E2E Test)' })).toBeVisible();

            // Нажимаем на "выделить всё" (чекбокс в заголовке таблицы)
            // Ищем первый input type="checkbox" внутри thead
            await page.locator('thead input[type="checkbox"]').check();

            // Нажимаем Импорт
            // В браузере выскочит окно confirm "Вы действительно хотите импортировать..."
            page.once('dialog', async dialog => {
                expect(dialog.message()).toContain('действительно хотите импортировать 1 услуг');
                await dialog.accept();
            });

            await page.locator('button', { hasText: 'Импорт (1)' }).click();

            // Ждем попап об успешном импорте 
            await expect(page.locator('div', { hasText: /Успешно импортировано услуг: 1/ })).toBeVisible({ timeout: 10000 });
        });


        // ==== ФАЗА 3: РЕДАКТИРОВАНИЕ ОПИСАНИЯ ====
        await test.step('Изменение параметров локальной услуги', async () => {
            await page.goto('/admin/services');
            
            // Вводим в поиск
            const searchInput = page.getByPlaceholder('Поиск тарифа по названию, ID...');
            await searchInput.fill('(E2E Test)');
            
            // Ждем дебаунса фильтрации и появления услуги в таблице
            await page.waitForTimeout(1000);
            await expect(page.locator('table', { hasText: 'Telegram Subscribers (E2E Test)' })).toBeVisible();

            // Кликаем по кнопке редактирования у этой услуги
            await page.locator('button[title="Редактировать"]').first().click();

            // Ждем открытия модалки
            await expect(page.locator('h3', { hasText: 'Редактирование тарифа' })).toBeVisible();

            // Изменяем описание (используем textarea с placeholder="HTML описание")
            const descArea = page.locator('textarea[placeholder*="Описание"]');
            await descArea.fill('E2E_AUTO_TEST Услуга премиум качества для Telegram');
            
            // Меняем цену для клиента
            const priceInput = page.locator('input[placeholder="150.00"]');
            await priceInput.fill('250');

            // Нажимаем "Сохранить"
            await page.locator('button', { hasText: 'Сохранить изменения' }).click();

            // Модалка закроется, проверяем тост
            await expect(page.locator('div', { hasText: 'Сохранено' })).toBeVisible();
        });


        // ==== ФАЗА 4: ПРОВЕРКА ОБНОВЛЕНИЙ ====
        await test.step('Верификация изменений в UI', async () => {
            // Ищем сохраненную цену в таблице
            await expect(page.locator('table', { hasText: '250.00₽' })).toBeVisible();
        });
    });
});
