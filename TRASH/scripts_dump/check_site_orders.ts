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

        const sites = [
            { id: 14, name: 'bestsmm.ru' },
            { id: 15, name: 'spetsnakrutka.ru' },
            { id: 16, name: 'prodvigaika.ru' }
        ];

        const results = [];

        for (const site of sites) {
            await page.goto(`https://panel.smmtoolbox.ru/admin/orders?site_id=${site.id}`);
            await page.waitForTimeout(2000);
            
            const paginationInfo = await page.evaluate(() => {
                const nav = document.querySelector('nav[aria-label="Pagination"]');
                if (!nav) return 'No pagination, probably very few orders.';
                const text = document.body.innerText;
                const match = text.match(/Showing \d+ to \d+ of ([\d\,]+) results/i) || text.match(/из ([\d\s]+)/i);
                if (match) return match[1].replace(/\s/g, '');
                
                // Fallback: look for the last page link
                const links = Array.from(document.querySelectorAll('.page-link'));
                const lastNum = Math.max(...links.map(a => parseInt((a as HTMLElement).innerText)).filter(n => !isNaN(n)));
                if (lastNum > 0) return `~${lastNum * 15} orders (last page ${lastNum})`;
                return 'Unknown pagination structure';
            });
            
            results.push({ site: site.name, info: paginationInfo });
        }

        console.log(JSON.stringify(results, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

run();
