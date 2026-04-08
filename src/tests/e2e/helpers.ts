import { Page } from '@playwright/test';

/**
 * Dismisses the cookie consent banner if present.
 * Must be called after page.goto() and before any UI interactions.
 */
export async function dismissCookieBanner(page: Page): Promise<void> {
    try {
        const acceptBtn = page.locator('button:has-text("Принять"), button:has-text("Accept"), button:has-text("OK")').first();
        if (await acceptBtn.isVisible({ timeout: 2000 })) {
            await acceptBtn.click();
            await page.waitForTimeout(300);
        }
    } catch {
        // Banner not present — continue
    }
}

/**
 * Performs admin login via /admin/login page (not /login).
 * Handles cookie banner and waits for successful redirect.
 */
export async function adminLogin(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    await dismissCookieBanner(page);

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.waitForTimeout(300);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to admin panel OR 2FA prompt
    await page.waitForURL(/\/(admin|2fa)/, { timeout: 15000 }).catch(() => null);
    await page.waitForLoadState('networkidle');
}

/**
 * Performs client login via /login page.
 * Handles cookie banner and waits for session.
 */
export async function clientLogin(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await dismissCookieBanner(page);

    await page.locator('input[type="email"], input[name="email"]').first().fill(email);
    await page.locator('input[type="password"], input[name="password"]').first().fill(password);
    await page.waitForTimeout(300);
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect to client area
    await page.waitForURL(/\/(catalog|dashboard|$)/, { timeout: 15000 }).catch(() => null);
    await page.waitForLoadState('networkidle');
}
