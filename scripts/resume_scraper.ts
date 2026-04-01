import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Shared config
const MAX_CONCURRENCY = 15;
const CHUNK_SIZE = 10;
const OUTPUT_FILE = path.join(process.cwd(), 'scripts', 'other_sites_orders_full.json');

let allOrders: any[] = [];
if (fs.existsSync(OUTPUT_FILE)) {
    allOrders = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    console.log(`Loaded ${allOrders.length} existing orders.`);
}

// Pages to resume from based on where it crashed + 5 pages buffer back
let currentPageNumbers: Record<number, number> = {
    14: 220, // bestsmm
    15: 9370, // spetsnakrutka
    16: 4030  // prodvigaika
};

let emptyStreaks: Record<number, number> = {
    14: 0,
    15: 0,
    16: 0
};

let activeSites = [14, 15, 16];

async function getNextPage(siteId: number): Promise<number | null> {
    if (!activeSites.includes(siteId)) return null;
    const p = currentPageNumbers[siteId];
    currentPageNumbers[siteId] += 1;
    return p;
}

function finishSite(siteId: number) {
    activeSites = activeSites.filter(id => id !== siteId);
}

// Reuse the extract logic
async function extractOrders(page: any): Promise<any[]> {
    return await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        
        // If it says "No data available in table", length is 1 but columns are few
        if (rows.length === 1 && (rows[0] as HTMLElement).innerText.includes('data available')) return [];

        return rows.map(r => {
            const cols = Array.from(r.querySelectorAll('td'));
            if (cols.length < 8) return null; // malformed row

            // ID
            const idCol = cols[0].innerText.trim();
            // USER
            const userCol = cols[1].innerText.trim();
            // INFO (Category, Service, Link, Count, Date)
            const infoCol = cols[2].innerText.trim();
            // PRICE
            const priceText = cols[3].innerText.replace(/[^\d.]/g, '');
            const price = parseFloat(priceText) || 0;
            // STATUS
            const statusCol = cols[4].innerText.trim();

            let category = '-';
            let service = '-';
            let link = '-';
            let count = '-';
            let date = '-';

            const infoLines = cols[2].innerHTML.split('<br>').map(l => {
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

            // Reason logic requires clicking, but we skip for speed and get basic
            let reason = '-';
            const statusA = cols[4].querySelector('a');
            if (statusA && statusA.hasAttribute('title')) {
                reason = statusA.getAttribute('title') || '-';
            }

            return {
                id: idCol,
                user: userCol,
                category,
                service,
                link,
                count,
                date,
                revenue: price,
                status: statusCol,
                reason
            };
        }).filter(o => o !== null);
    });
}

function saveState() {
    // filter duplicates by ID + Site to be safe since we buffered back
    const unique = new Map();
    for (const o of allOrders) {
        unique.set(o.site + '_' + o.id, o);
    }
    const finalArray = Array.from(unique.values());
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalArray, null, 2));
    console.log(`[Save] Data merged. Total unique orders: ${finalArray.length}`);
}

async function workerLoop(browser: any, siteId: number, workerId: number, cookies: any[]) {
    const context = await browser.newContext();
    await context.addCookies(cookies);

    // block assets
    await context.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (['image', 'font', 'stylesheet', 'media'].includes(type)) {
            route.abort();
        } else {
            route.continue();
        }
    });

    const page = await context.newPage();

    let errorStreak = 0;

    while (true) {
        const pNum = await getNextPage(siteId);
        if (pNum === null) break;

        const url = `https://panel.smmtoolbox.ru/admin/orders?site_id=${siteId}&page=${pNum}`;
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            
            // Allow JS to run
            await page.waitForTimeout(200);
            
            const ordersFromPage = await extractOrders(page);

            if (ordersFromPage.length === 0) {
                // Check if truly empty
                const hasEmptyText = await page.evaluate(() => {
                    const tbody = document.querySelector('table tbody');
                    return tbody ? tbody.innerHTML.includes('data available') : false;
                });

                if (hasEmptyText) {
                    emptyStreaks[siteId]++;
                    console.log(`[Worker ${workerId}] Site ${siteId} page ${pNum} EMPTY. Streak: ${emptyStreaks[siteId]}`);
                    if (emptyStreaks[siteId] >= 5) {
                        finishSite(siteId);
                        break;
                    }
                } else {
                    // Page failed to render properly
                    throw new Error("Empty table but no empty text. Render failure.");
                }
            } else {
                emptyStreaks[siteId] = 0; // reset
                errorStreak = 0; // reset
                const mappedOrders = ordersFromPage.map((o: any) => {
                    o.site = siteId === 14 ? 'bestsmm.ru' : siteId === 15 ? 'spetsnakrutka.ru' : 'prodvigaika.ru';
                    return o;
                });
                
                allOrders.push(...mappedOrders);
                
                if (pNum % 20 === 0) {
                    console.log(`  [Worker ${workerId}] Handled site ${siteId} page ${pNum}. Total buffered: ${allOrders.length}`);
                }
            }
        } catch(e: unknown) {
            const err = e as Error;
            errorStreak++;
            currentPageNumbers[siteId] = Math.min(currentPageNumbers[siteId], pNum); // Push back to try again
            console.log(`  [Worker ${workerId}] Error on page ${pNum} (${err.message}). Retrying... (Streak: ${errorStreak})`);
            if (errorStreak > 15) {
                console.log(`  [Worker ${workerId}] Critical error streak. Exiting worker.`);
                break;
            }
        }
    }

    await page.close();
    await context.close();
}

async function runResume() {
    const browser = await chromium.launch({ headless: true });

    // Login logic
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

    // Process site by site instead of parallel per site to avoid overloading SMMToolbox differently
    const sites = [14, 15, 16];
    
    for (const sId of sites) {
        console.log(`\n\nResuming scrape for site_id=${sId}...`);
        
        const workerPromises: Promise<void>[] = [];
        for (let i = 1; i <= MAX_CONCURRENCY; i++) {
            // slight stagger
            await new Promise(r => setTimeout(r, 200));
            workerPromises.push(workerLoop(browser, sId, i, cookies));
        }

        await Promise.all(workerPromises);
        console.log(`Finished resuming site ${sId}.`);
        saveState();
    }

    await browser.close();
    console.log('\nAll done!');
}

runResume().catch(console.error);
