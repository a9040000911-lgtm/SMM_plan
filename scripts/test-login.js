const { chromium } = require('playwright');

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://panel.smmtoolbox.ru/admin/login');
        await page.fill('input[name="email"]', 'a.sokolov@smm');
        await page.fill('input[name="password"]', 'Ud5pgC-4uK');
        await page.click('button[type="submit"]');
        await page.waitForSelector('#page-header-user-dropdown', { timeout: 10000 });
        console.log('LOGIN_SUCCESS');
        await browser.close();
    } catch(e) {
        console.error('FAILED', e.message);
        process.exit(1);
    }
})();
