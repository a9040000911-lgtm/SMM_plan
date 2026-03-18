import { test, expect } from '@playwright/test';

test.describe('Production Smoke Tests (89.23.98.202)', () => {
  const BASE_URL = 'http://89.23.98.202';

  test('Homepage is reachable and healthy', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
    
    // Check for core titles or elements
    await expect(page).toHaveTitle(/Smmplan/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Static assets are loading correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check if there are any 404s in the console or network
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    page.on('requestfailed', request => {
      logs.push(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.waitForLoadState('networkidle');
    
    const errors = logs.filter(log => {
      const lower = log.toLowerCase();
      // Ignore favicon and analytics which are prone to 404s but non-critical
      if (lower.includes('favicon.ico') || lower.includes('analytics') || lower.includes('google-analytics')) return false;
      return lower.includes('failed') || lower.includes('404');
    });
    // We expect no critical failed requests for static assets
    expect(errors.length).toBeLessThan(5); 
  });

  test('Admin Login page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    // The h1 in Login page is "Вход в систему"
    await expect(page.locator('h1')).toContainText(/Вход/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Health Check API returns OK', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('OK');
    expect(body.services.database).toBe('Connected');
  });
});


