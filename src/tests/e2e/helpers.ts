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
    await page.waitForLoadState('domcontentloaded');
    await dismissCookieBanner(page);

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.waitForTimeout(300);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect: either to /admin (2FA disabled or bootstrap)
    // or to trigger 2FA prompt (requires2fa=true → shows code input on same page)
    await page.waitForTimeout(2000); // allow client-side fetch + router.push to fire

    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
        // If still on login page — check if 2FA code input appeared
        const has2fa = await page.locator('input[placeholder="000000"]').isVisible({ timeout: 3000 }).catch(() => false);
        if (has2fa) {
            const masterKey = process.env.ADMIN_MASTER_KEY || '777777';
            if (masterKey) {
                page.once('dialog', dialog => {
                    console.log('DIALOG FIRED:', dialog.message());
                    dialog.accept();
                });
                await page.locator('input[placeholder="000000"]').fill(masterKey);
                await page.locator('button[type="submit"]').click();

                // wait a bit to see if dialog fires
                await page.waitForTimeout(1000);
            } else {
                throw new Error('2FA required but no ADMIN_MASTER_KEY found.');
            }
        }
    }

    // Wait for final /admin landing
    await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
}


/**
 * Performs client login via /login page.
 * Handles cookie banner and waits for session.
 */
export async function clientLogin(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await dismissCookieBanner(page);

    await page.locator('input[type="email"], input[name="email"]').first().fill(email);
    await page.locator('input[type="password"], input[name="password"]').first().fill(password);
    await page.waitForTimeout(300);
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect to client area
    await page.waitForURL(/\/(catalog|dashboard|$)/, { timeout: 15000 }).catch(() => null);
    await page.waitForLoadState('domcontentloaded');
}
