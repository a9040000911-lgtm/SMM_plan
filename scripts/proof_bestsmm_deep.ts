import { chromium } from 'playwright';

async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://panel.smmtoolbox.ru/admin/login');
        await page.fill('input[name="email"]', 'a.sokolov@smm');
        await page.fill('input[name="password"]', 'Ud5pgC-4uK');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        await page.goto('https://panel.smmtoolbox.ru/admin/orders?site_id=14&page=221');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'D:\\Smmplan\\bestsmm_page221_proof.png', fullPage: true });
        console.log('Screenshot of page 221 saved.');

        await page.goto('https://panel.smmtoolbox.ru/admin/orders?page=2688&site_id=14');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'D:\\Smmplan\\bestsmm_page2688_proof.png', fullPage: true });
        console.log('Screenshot of page 2688 saved.');

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

run();
