import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    console.log('Starting FULL extraction of small sites...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let allOrders = [];

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

        for (const site of sites) {
            console.log(`Checking ${site.name}...`);
            let pageNum = 1;
            let dbIDTracker = new Set();
            let hasMore = true;
            
            while (hasMore) {
                const url = `https://panel.smmtoolbox.ru/admin/orders?site_id=${site.id}&page=${pageNum}`;
                await page.goto(url, { waitUntil: 'load' });
                await page.waitForTimeout(1000); // Wait for table load
                
                const orders = await page.evaluate((siteName) => {
                    const rows = Array.from(document.querySelectorAll('table tbody tr'));
                    return rows.map(row => {
                        const cells = Array.from(row.querySelectorAll('td'));
                        if (cells.length < 5) return null; // not a data row
                        
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

                        // Get cost and map to revenue
                        const priceText = cells[3]?.innerText.trim() || '0 ₽';
                        const priceAmt = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

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
                            price: priceText,
                            revenue: priceAmt,
                            date: cells[5]?.innerText.trim(),
                            reason: pReason,
                            provider: pName
                        };
                    }).filter(x => x !== null);
                }, site.name);
                
                if (orders.length === 0) {
                    hasMore = false;
                    console.log(`  End of data at page ${pageNum}.`);
                } else {
                    let newOrdersCount = 0;
                    for (const o of orders) {
                        if (!dbIDTracker.has(o.id)) {
                            dbIDTracker.add(o.id);
                            allOrders.push(o);
                            newOrdersCount++;
                        }
                    }
                    if (newOrdersCount === 0) {
                        console.log(`  No new unique orders found on page ${pageNum}. End of data.`);
                        hasMore = false;
                    } else {
                        console.log(`  Found ${newOrdersCount} orders on page ${pageNum}.`);
                        pageNum++;
                    }
                }
                
                // Safety cutoff for small sites
                if (pageNum > 100) {
                    console.log("Reached safety limit of 100 pages.");
                    break;
                }
            }
        }

        const outPath = path.join(process.cwd(), 'scripts', 'other_sites_orders_full.json');
        fs.writeFileSync(outPath, JSON.stringify(allOrders, null, 2));
        console.log(`Saved ${allOrders.length} total unique orders across all 3 sites to ${outPath}`);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

run();
