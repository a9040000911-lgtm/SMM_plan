const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeOrders() {
    console.log('--- STARTING VANILLA JS HIGH-SPEED ORDER SCRAPER ---');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const loginPage = await context.newPage();

    try {
        console.log('[1/4] Logging in...');
        await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
        await loginPage.fill('input[name="email"]', 'a.sokolov@smm');
        await loginPage.fill('input[name="password"]', 'Ud5pgC-4uK');
        await loginPage.click('button[type="submit"]');
        await loginPage.waitForSelector('#page-header-user-dropdown', { timeout: 15000 });
        console.log('Login successful.');

        const startPage = 86408;
        const totalTargets = 10000;
        const ordersPerPage = 15;
        const pagesToScrape = Math.ceil(totalTargets / ordersPerPage);
        const concurrency = 15;
        
        const allOrders = [];
        const pages = Array.from({ length: pagesToScrape }, (_, i) => startPage - i);
        
        console.log(`[2/4] Initializing batch scrape of ${pagesToScrape} pages with concurrency ${concurrency}...`);
        
        const startTime = Date.now();

        const worker = async (workerId) => {
            const page = await context.newPage();
            await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());
            
            while (pages.length > 0) {
                const pageNum = pages.shift();
                if (!pageNum || pageNum < 1) break;

                const url = `https://panel.smmtoolbox.ru/admin/orders?site_id=1&page=${pageNum}`;
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    
                    const pageData = await page.evaluate(() => {
                        const rows = Array.from(document.querySelectorAll('table tbody tr'));
                        return rows.map(row => {
                            const cells = Array.from(row.querySelectorAll('td'));
                            if (cells.length < 5) return null;
                            
                            const composite = cells[2];
                            if (!composite) return null;

                            // Target the narrowest div that contains the label
                            const getVal = (label) => {
                                const divs = Array.from(composite.querySelectorAll('div'));
                                // Filter for divs that have the label as a direct text match or starting text
                                const target = divs.find(d => {
                                    const firstStrong = d.querySelector('strong');
                                    return firstStrong && firstStrong.innerText.includes(label);
                                });
                                if (!target) return '-';
                                const a = target.querySelector('a');
                                return a ? a.innerText.trim() : target.innerText.replace(label, '').trim();
                            };

                            const getLink = () => {
                                const divs = Array.from(composite.querySelectorAll('div'));
                                const target = divs.find(d => {
                                    const firstStrong = d.querySelector('strong');
                                    return firstStrong && firstStrong.innerText.includes('Ссылка:');
                                });
                                if (!target) return '-';
                                const a = target.querySelector('a');
                                return a ? a.href : target.innerText.replace('Ссылка:', '').trim();
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
                                id: cells[0]?.innerText.trim(),
                                user: cells[1]?.innerText.trim(),
                                category: getVal('Категория:'),
                                activity: getVal('Активность:'),
                                service: getVal('Сервис:'),
                                link: getLink(),
                                amount: getVal('Кол-во:'),
                                status: cells[4]?.innerText.trim(),
                                price: cells[3]?.innerText.trim(),
                                date: cells[5]?.innerText.trim(),
                                reason: pReason,
                                provider: pName
                            };
                        }).filter(x => x !== null);
                    });

                    allOrders.push(...pageData);
                    if (allOrders.length % 150 === 0 || pages.length === 0) {
                        console.log(`Progress: ${allOrders.length} orders collected. Pages left: ${pages.length}`);
                    }
                } catch (e) {
                    console.error(`Page ${pageNum} error:`, e.message);
                    pages.push(pageNum);
                }
            }
            await page.close();
        };

        const workers = Array.from({ length: concurrency }, (_, i) => worker(i));
        await Promise.all(workers);

        const endTime = Date.now();
        const durationSec = (endTime - startTime) / 1000;
        console.log(`[3/4] Scraping complete! Total: ${allOrders.length}, Duration: ${durationSec}s`);

        const outputPath = path.join(__dirname, 'real_orders_testing_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(allOrders.slice(0, totalTargets), null, 2));
        console.log(`[4/4] Data saved to ${outputPath}`);

    } catch (error) {
        console.error('Fatal Scraper Error:', error);
    } finally {
        await browser.close();
    }
}

scrapeOrders();
