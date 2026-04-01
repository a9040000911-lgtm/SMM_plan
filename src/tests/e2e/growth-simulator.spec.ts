import { test, expect } from '@playwright/test';

test.describe('Growth Simulator E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    
    // Accept cookies to clear the way
    const cookieBtn = page.locator('button:has-text("ПРИНЯТЬ")');
    if (await cookieBtn.isVisible()) {
      await cookieBtn.click();
      await page.waitForTimeout(500); // Wait for animation
    }
    
    // Scroll to simulator
    await page.getByTestId('simulator-container').scrollIntoViewIfNeeded();
  });

  test('should render and allow basic interactions', async ({ page }) => {
    const simulator = page.getByTestId('simulator-container');
    await expect(simulator).toBeVisible({ timeout: 10000 });

    // 1. Check Platform Switching
    const platformInsta = page.getByTestId('platform-instagram');
    await platformInsta.click({ force: true });
    
    // 2. Adjust Reach (Current & Target)
    // We use fill() which should trigger 'input' and 'change' events
    const currentSlider = page.getByTestId('input-current-reach');
    const targetSlider = page.getByTestId('input-target-reach');
    
    await currentSlider.fill('1000');
    await targetSlider.fill('5000');
    
    // Additional wait for React state to propagate
    await page.waitForTimeout(1000);

    // 3. Select Strategy
    const eliteStrategy = page.getByTestId('strategy-ELITE');
    await eliteStrategy.click({ force: true });
    await page.waitForTimeout(500);

    // 4. Check Calculation (Price)
    // Diff 4000 (Target 5000 - Current 1000). Price ELITE 0.35. Total 1400.
    const priceDisplay = page.locator('text=1400');
    await expect(priceDisplay).toBeVisible({ timeout: 15000 });

    // 5. Add to Cart
    const addBtn = page.getByTestId('btn-add-to-cart');
    await addBtn.click({ force: true });

    // Verify localStorage change
    await expect.poll(async () => {
      const cart = await page.evaluate(() => localStorage.getItem('cart'));
      return cart;
    }, { timeout: 10000 }).toContain('GROWTH_PACKAGE');
  });

  test('should show "How it works" modal', async ({ page }) => {
    const trigger = page.getByTestId('how-it-works-trigger');
    await trigger.click({ force: true });

    const modal = page.getByTestId('modal-how-it-works');
    await expect(modal).toBeVisible();

    const closeBtn = page.getByTestId('btn-close-modal');
    await closeBtn.click({ force: true });
    await expect(modal).not.toBeVisible();
  });
});
