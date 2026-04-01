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
        await page.waitForTimeout(3000); // give it time to load

        // The site selector is usually a select element or dropdown. Let's find links containing site_id or the select.
        const siteSelectorHtml = await page.evaluate(() => {
            const selects = Array.from(document.querySelectorAll('select'));
            const options = selects.flatMap(s => Array.from(s.querySelectorAll('option'))).map(o => ({ text: o.innerText, value: o.value }));
            
            const links = Array.from(document.querySelectorAll('a')).filter(a => a.href.includes('site_id=')).map(a => ({ text: a.innerText, href: a.href }));
            
            return { options, links };
        });

        console.log("Site Selector Info:", JSON.stringify(siteSelectorHtml, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

run();
