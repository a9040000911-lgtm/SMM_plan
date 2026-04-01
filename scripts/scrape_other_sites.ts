import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    console.log('Starting extraction of small sites...');
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

        const allOrders = [];

        for (const site of sites) {
            console.log(`Checking ${site.name}...`);
            await page.goto(`https://panel.smmtoolbox.ru/admin/orders?site_id=${site.id}`);
            await page.waitForTimeout(2000);
            
            const orders = await page.evaluate((siteName) => {
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                return rows.map(row => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    if (cells.length < 5) return null;
                    
                    const composite = cells[2];
                    if (!composite) return null;

                    const divs = Array.from(composite.querySelectorAll('div'));
                    const getVal = (label: string) => {
                        const target = divs.find(d => d.innerText && d.innerText.includes(label));
                        return target ? target.innerText.replace(label, '').trim() : '-';
                    };

                    const providerDiv = composite.querySelector('.additional-data');
                    let pName = '-';
                    let pReason = '-';
                    if (providerDiv) {
                        const pDivs = Array.from(providerDiv.querySelectorAll('div'));
                        pDivs.forEach(d => {
                            if (d.innerText.includes('Провайдер:')) pName = d.innerText.replace('Провайдер:', '').trim();
                            if (d.innerText.includes('Комментарий провайдера:')) pReason = d.innerText.replace('Комментарий провайдера:', '').trim();
                        });
                    }

                    return {
                        site: siteName,
                        id: cells[0]?.innerText.trim(),
                        user: cells[1]?.innerText.trim(),
                        category: getVal('Категория:'),
                        activity: getVal('Активность:'),
                        service: getVal('Сервис:'),
                        link: getVal('Ссылка:'),
                        amount: getVal('Кол-во:'),
                        status: cells[4]?.innerText.trim(),
                        price: cells[3]?.innerText.trim(),
                        date: cells[5]?.innerText.trim(),
                        reason: pReason,
                        provider: pName
                    };
                }).filter(x => x !== null);
            }, site.name);
            
            console.log(`  Found ${orders.length} orders on page 1.`);
            allOrders.push(...orders);
        }

        const outPath = path.join(process.cwd(), 'scripts', 'other_sites_orders.json');
        fs.writeFileSync(outPath, JSON.stringify(allOrders, null, 2));
        console.log(`Saved ${allOrders.length} total orders to ${outPath}`);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

run();
