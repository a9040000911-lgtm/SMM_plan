import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Reduced concurrency to avoid 502/504 Gateway Timeouts from SMMToolbox backend
const MAX_CONCURRENCY = 5; 
const OUTPUT_FILE = path.join(process.cwd(), 'scripts', 'other_sites_orders_full_fixed.json');
const STATE_FILE = path.join(process.cwd(), 'scripts', 'other_sites_scrape_state.json');

// We load the state to know exactly where to resume
let scrapeState: Record<number, number> = {
    14: 215, // resume before crash point
    15: 9370,
    16: 4030
};
if (fs.existsSync(STATE_FILE)) {
    scrapeState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

let activeSites = [14, 15, 16];
// If they reached their terminal max page (user provided) or naturally ended
function getNextPage(siteId: number): number | null {
    if (!activeSites.includes(siteId)) return null;
    const p = scrapeState[siteId];
    scrapeState[siteId]++;
    fs.writeFileSync(STATE_FILE, JSON.stringify(scrapeState));
    return p;
}

function finishSite(siteId: number) {
    activeSites = activeSites.filter(id => id !== siteId);
    console.log(`\n\n==== SITE ${siteId} FINISHED STRIPING ==== \n\n`);
}

async function runResume() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const loginPage = await context.newPage();
    console.log('[1/2] Logging in...');
    await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
    await loginPage.fill('input[name="email"]', 'a.sokolov@smm');
    await loginPage.fill('input[name="password"]', 'Ud5pgC-4uK');
    await loginPage.click('button[type="submit"]');
    await loginPage.waitForSelector('#page-header-user-dropdown', { timeout: 15000 });
    console.log('Login successful.');

    const cookies = await context.cookies();
    await loginPage.close();

    // Block assets
    await context.route('**/*', (route: any) => {
        const type = route.request().resourceType();
        if (['image', 'font', 'stylesheet', 'media'].includes(type)) {
            route.abort();
        } else {
            route.continue();
        }
    });

    const workerLoop = async (siteId: number, workerId: number) => {
        const page = await context.newPage();
        
        while (activeSites.includes(siteId)) {
            const pNum = getNextPage(siteId);
            if (pNum === null) break;

            const url = `https://panel.smmtoolbox.ru/admin/orders?page=${pNum}&site_id=${siteId}`;
            let success = false;
            let attempts = 0;

            while (!success && attempts < 10) {
                attempts++;
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    
                    // Wait explicitly for the table or empty warning
                    await page.waitForSelector('table', { timeout: 8000 });
                    
                    const ordersFromPage = await page.evaluate((sId: number) => {
                        const rows = Array.from(document.querySelectorAll('table tbody tr'));
                        if (rows.length === 1 && (rows[0] as HTMLElement).innerText.includes('data available')) return 'EMPTY';
                        
                        return rows.map(r => {
                            const cols = Array.from(r.querySelectorAll('td'));
                            if (cols.length < 5) return null;
                            const idCol = cols[0]?.innerText.trim();
                            const userCol = cols[1]?.innerText.trim();
                            const statusCol = cols[4]?.innerText.trim();
                            const priceText = cols[3]?.innerText.replace(/[^\d.]/g, '') || '0';
                            
                            let category = '-', service = '-', link = '-', count = '-', date = '-';
                            const infoHtml = cols[2]?.innerHTML || '';
                            const infoLines = infoHtml.split('<br>').map(l => {
                                const tmp = document.createElement('div');
                                tmp.innerHTML = l;
                                return tmp.innerText.trim();
                            });
                            for (const line of infoLines) {
                                if (line.includes('Категория:')) category = line.replace('Категория:', '').trim();
                                else if (line.includes('Сервис:')) service = line.replace('Сервис:', '').trim();
                                else if (line.includes('Ссылка:')) link = line.replace('Ссылка:', '').trim();
                                else if (line.includes('Кол-во:')) count = line.replace('Кол-во:', '').trim();
                                else if (line.includes('Дата создания:')) date = line.replace('Дата создания:', '').trim();
                            }
                            return {
                                site: sId === 14 ? 'bestsmm.ru' : sId === 15 ? 'spetsnakrutka.ru' : 'prodvigaika.ru',
                                id: idCol, user: userCol, category, service, link, count, date, revenue: parseFloat(priceText), status: statusCol
                            };
                        }).filter(o => o !== null);
                    }, siteId);

                    if (ordersFromPage === 'EMPTY') {
                        // Truly reached the end natively
                        finishSite(siteId);
                        success = true; // Bail out nicely
                    } else if (Array.isArray(ordersFromPage) && ordersFromPage.length > 0) {
                        // Append instantly to file (newline delimited JSON stream to avoid memory crashing)
                        const streamData = ordersFromPage.map(o => JSON.stringify(o)).join('\n') + '\n';
                        fs.appendFileSync(OUTPUT_FILE, streamData);
                        
                        success = true;
                        if (pNum % 50 === 0) {
                            console.log(`[Worker ${workerId}] Handled Site ${siteId} Page ${pNum}`);
                        }
                    } else {
                        // Rows exist, but matched 0. Probably malformed 500 render issue
                        console.log(`[Worker ${workerId}] Render issue on Site ${siteId} Page ${pNum}. Retrying...`);
                        await page.waitForTimeout(2000);
                    }
                } catch (e: any) {
                    console.log(`[Worker ${workerId}] Timeout/Error Site ${siteId} Page ${pNum}: ${e.message}. Retrying (${attempts}/10)...`);
                    await page.waitForTimeout(2000);
                }
            }
            if (!success) {
                console.log(`[Worker ${workerId}] FATAL: Skipped Site ${siteId} Page ${pNum} after 10 retries.`);
            }
        }
        await page.close();
    };

    console.log('[2/2] Starting rock-solid scraper (5 workers)...');
    
    // We will do site by site, 5 workers each
    for (const site of [14, 15, 16]) {
        console.log(`Starting site ${site}...`);
        const promises = [];
        for (let i = 0; i < MAX_CONCURRENCY; i++) {
            promises.push(workerLoop(site, i));
            await new Promise(r => setTimeout(r, 500));
        }
        await Promise.all(promises);
    }
    
    await browser.close();
    console.log('Finished fully robust scrape.');
}

runResume().catch(console.error);
