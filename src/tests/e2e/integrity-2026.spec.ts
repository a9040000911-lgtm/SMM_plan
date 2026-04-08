import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Smmplan 2026 Integrity Tests', () => {

  test('Homepage Features: Growth Simulator', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Verify Simulator section is rendered using data-testid (added in last refactor)
    await expect(page.getByTestId('simulator-container')).toBeVisible({ timeout: 15000 });
    
    // Verify platform buttons are rendered (Instagram button via data-testid)
    await expect(page.getByTestId('platform-instagram')).toBeVisible({ timeout: 10000 });
  });


  test('Academy: Articles Grid & Content', async ({ page }) => {
    await page.goto(`${BASE_URL}/academy`);
    await page.waitForLoadState('networkidle');
    
    // Wait for at least one article link to appear
    await page.waitForSelector('a[href^="/academy/"]', { timeout: 15000 });
    
    const articleLinks = page.locator('a[href^="/academy/"]');
    const count = await articleLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Navigate to a specific article
    await page.goto(`${BASE_URL}/academy/instagram-reels-retention-guide-2026`);
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(/Reels/i);
    
    // Verify Scientific Insights section
    await expect(page.locator('div:has-text("Scientific IR Optimized")').first()).toBeVisible();
    
    // Verify Recommended Services CTA
    await expect(page.getByRole('heading', { name: /Готовы к результатам/i }).first()).toBeVisible();
  });

  test('Academy: Platform Guides Routing', async ({ page }) => {
    // Test the new guides/[platform] route
    await page.goto(`${BASE_URL}/academy/guides/telegram`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Telegram/i);
  });

  test('AI-Ready Manifest: Visual & Raw Modes', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-manifest`);
    await page.waitForLoadState('networkidle');
    
    // Header
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/AI-Ready/i);
    
    // Visual mode check (by default)
    await expect(page.getByRole('heading', { name: "Mission / Role" })).toBeVisible();

    // Switch to Raw JSON
    await page.click('button:has-text("Raw JSON")');
    await expect(page.locator('pre')).toContainText(/"identity"/i);
  });

  test('Footer Navigation: AI Manifest Link', async ({ page }) => {
    await page.goto(BASE_URL);
    const manifestLink = page.locator('footer a[href="/ai-manifest"]');
    await expect(manifestLink).toBeVisible();
    await expect(manifestLink).toContainText(/AI-Ready Manifest/i);
  });

});
