import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    console.log('--- STARTING MULTI-THREADED (15 workers) EXTRACTOR ---');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const loginPage = await context.newPage();

    let allOrders: any[] = [];

    try {
        console.log('[1/4] Logging in...');
        await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
        await loginPage.fill('input[name="email"]', 'a.sokolov@smm');
        await loginPage.fill('input[name="password"]', 'Ud5pgC-4uK');
        await loginPage.click('button[type="submit"]');
        await loginPage.waitForSelector('#page-header-user-dropdown', { timeout: 15000 });
        console.log('Login successful.');

        const sites = [
            { id: 14, name: 'bestsmm.ru' },
            { id: 15, name: 'spetsnakrutka.ru' },
            { id: 16, name: 'prodvigaika.ru' }
        ];

        for (const site of sites) {
            console.log(`\n[2/4] Initializing batch scrape of ${site.name} (site_id=${site.id}) with 15 concurrency...`);
            
            let currentPage = 1;
            let endReached = false;
            let errorStreak = 0;
            const startTime = Date.now();

            const worker = async (workerId: number) => {
                const page = await context.newPage();
                // Abort images and fonts to speed up
                await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());

                while (!endReached) {
                    const pageNum = currentPage++;
                    const url = `https://panel.smmtoolbox.ru/admin/orders?site_id=${site.id}&page=${pageNum}`;
                    
                    try {
                        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                        
                        // Wait a bit for JS to render the table if needed, though domcontentloaded usually gets the basic HTML.
                        // SMMToolbox uses server-side rendering for standard pages.
                        const orderData: any = await page.evaluate((siteName) => {
                            const rows = Array.from(document.querySelectorAll('table tbody tr'));
                            if (rows.length === 0) return [];
                            // If it says "No data available in table", length is 1 but columns are few
                            if (rows.length === 1 && (rows[0] as HTMLElement).innerText.includes('data available')) return [];

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

                        if (orderData.length === 0) {
                            // Page empty, meaning we reached end
                            endReached = true;
                        } else {
                            allOrders.push(...orderData);
                            errorStreak = 0;
                            if (pageNum % 20 === 0) {
                                console.log(`  [Worker ${workerId}] Handled page ${pageNum}. Collected so far: ${allOrders.length}`);
                            }
                        }

                    } catch (e) {
                        console.error(`  [Worker ${workerId}] Error on page ${pageNum}: ${(e as Error).message}`);
                        currentPage--; // simple retry
                        errorStreak++;
                        if (errorStreak > 30) {
                            console.log('Too many errors in a row. Stopping to avoid deadlock.');
                            endReached = true;
                        }
                    }
                }
                
                await page.close();
            };

            const concurrency = 15;
            const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
            await Promise.all(workers);

            const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[3/4] Finished scraping ${site.name} in ${durationSec}s.`);
        }

        const outPath = path.join(process.cwd(), 'scripts', 'other_sites_orders_full.json');
        fs.writeFileSync(outPath, JSON.stringify(allOrders, null, 2));
        console.log(`[4/4] Data saved successfully to ${outPath}. Total orders: ${allOrders.length}`);

    } catch (e) {
        console.error('Fatal Scraper Error:', e);
    } finally {
        await browser.close();
    }
}

run();
