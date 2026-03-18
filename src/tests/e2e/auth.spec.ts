/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should show login page and require 2FA for email login', async ({ page }) => {
    await page.goto('/admin/login');

    // Проверяем наличие заголовка H1
    await expect(page.locator('h1')).toBeVisible();

    // Заполняем поля
    await page.fill('input[type="email"]', 'admin@smmplan.com');
    await page.fill('input[type="password"]', 'ChangeMe2026!');

    // Кликаем кнопку отправки
    await page.click('button[type="submit"]');

    // Ожидаем появления окна 2FA (проверяем по наличию поля ввода с длинным font-mono)
    await expect(page.locator('input[maxlength="6"]')).toBeVisible({ timeout: 15000 });
  });

  test('should toggle between tabs', async ({ page }) => {
    await page.goto('/admin/login');

    // Кликаем на вторую кнопку во вкладках (Telegram)
    await page.locator('button:has-text("Telegram")').click();
    
    // Кликаем на первую кнопку во вкладках (Email)
    await page.locator('button:has-text("Почта")').click();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});


