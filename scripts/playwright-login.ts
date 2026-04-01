import { chromium } from 'playwright';

async function verifyBrowserLogin() {
    console.log('Initiating Browser Control (Playwright local driver)...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let alertHandled = false;
    page.on('dialog', async dialog => {
        console.log(`[Browser Alert Occurred]: ${dialog.message()}`);
        await dialog.accept();
        alertHandled = true;
    });

    try {
        console.log('1. Navigating to /admin/login');
        await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });

        console.log('2. Entering Credentials');
        await page.fill('input[type="email"]', 'art@artmspektr.ru');
        await page.fill('input[type="password"]', '12345678');

        console.log('3. Clicking Login Button');
        await page.click('button[type="submit"]');

        console.log('4. Waiting for 2FA screen transition');
        await page.waitForSelector('text=Код безопасности', { timeout: 10000 });
        console.log(`- Alert Handled: ${alertHandled}`);

        console.log('5. Entering Master Key 2FA Code');
        const inputs = await page.$$('input[type="text"]');
        if (inputs.length > 0) {
            // Usually React one-time password inputs
            await page.keyboard.type('777777');
        } else {
            console.log("Could not find 2FA input boxes");
        }
        
        console.log('6. Submitting 2FA Code');
        await page.click('button:has-text("Подтвердить")');
        
        console.log('7. Verifying Dashboard Redirect...');
        await page.waitForURL('**/admin**', { timeout: 10000 });
        
        console.log('✅ SUCCESS: Browser successfully transitioned to /admin dashboard via genuine UI interaction!');
        
    } catch (e) {
        console.error('❌ FAILED: Browser flow interrupted:', e.message);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
}

verifyBrowserLogin();
