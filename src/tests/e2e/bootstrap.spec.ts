import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { adminLogin } from './helpers';
import bcrypt from 'bcryptjs';

/**
 * Bootstrap / First-Login Flow
 *
 * Tests admin login with a pre-created account (2FA disabled).
 * We can't realistically test the TRUE bootstrap (zero admins in DB)
 * in a CI environment that already has data — so we test the login
 * flow which exercises the same code path post-bootstrap.
 */
test.describe('Admin Login Flow', () => {
  test.beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('BootstrapPass2026!', 10);
    await prisma.user.upsert({
      where: { email: 'bootstrap-e2e@smmplan.pro' },
      create: {
        email: 'bootstrap-e2e@smmplan.pro',
        role: 'ADMIN',
        password: hashedPassword,
        isGlobalAdmin: true,
        twoFactorEnabled: false,
        username: 'Bootstrap Tester',
      },
      update: {
        password: hashedPassword,
        isGlobalAdmin: true,
        twoFactorEnabled: false,
      },
    });
  });

  test('should login and redirect to admin dashboard', async ({ page }) => {
    test.setTimeout(60000);

    await adminLogin(page, 'bootstrap-e2e@smmplan.pro', 'BootstrapPass2026!');

    // After login — should be on /admin page
    await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });

    // Admin sidebar or dashboard heading should be visible
    await expect(
      page.locator('aside, nav[aria-label="Admin"], [data-testid="admin-sidebar"]').first()
    ).toBeVisible({ timeout: 15000 });

    console.log('Test PASSED: Admin login successful and dashboard is visible.');
  });
});
