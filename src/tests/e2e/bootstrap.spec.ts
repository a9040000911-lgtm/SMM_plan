import { test, expect } from '@playwright/test';

/**
 * Тест для проверки режима "Bootstrap" c расширенной отладкой.
 */
test.describe('Admin Bootstrap Flow Debug', () => {
  test('should promote first user to admin and redirect to dashboard', async ({ page }) => {
    // Увеличиваем таймаут для этого теста
    test.setTimeout(90000);

    page.on('dialog', async dialog => {
      console.log(`DIALOG APPEARED: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // 1. Переходим на страницу логина
    console.log('Navigating to /admin/login...');
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/step1-initial.png' });

    // Принимаем куки
    const cookieButton = page.locator('button:has-text("Принять")');
    if (await cookieButton.isVisible()) {
      console.log('Clicking Cookie button...');
      await cookieButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/step2-cookie-clicked.png' });
    }

    // 2. Вводим данные
    const testAdminEmail = `admin-e2e-${Date.now()}@smmplan.pro`;
    const testAdminPass = 'ReliablePass2026!';

    console.log(`Filling email: ${testAdminEmail}`);
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 30000 });
    await page.fill('input[type="email"]', testAdminEmail);
    
    console.log('Filling password...');
    await page.fill('input[type="password"]', testAdminPass);
    await page.screenshot({ path: 'test-results/step3-filled.png' });

    // 3. Нажимаем кнопку входа
    console.log('Clicking login button...');
    await page.click('button[type="submit"]');

    // 4. Ожидаем редирект
    console.log('Waiting for navigation to /admin...');
    await page.waitForURL('**/admin', { timeout: 40000 });
    await page.screenshot({ path: 'test-results/step4-redirected.png' });

    // 5. Проверка хедера/меню
    await expect(page.locator('aside')).toBeVisible(); 
    console.log('Test PASSED: Redirected and Sidebar is visible.');
  });
});
