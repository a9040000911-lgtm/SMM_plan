const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * MASTER SCRAPER: ALL ORDERS & EMAILS
 * Features:
 * - Resumable (checks progress.json)
 * - Memory efficient (writes to disk in chunks)
 * - High concurrency
 * - Site ID specific data separation
 */

async function scrapeAllOrders() {
    console.log('--- STARTING MASTER SCRAPER: ALL ORDERS & EMAILS ---');
    
    const PROGRESS_FILE = path.join(__dirname, 'scrape_progress.json');
    const DATA_DIR = path.join(__dirname, 'all_orders_data');
    const EMAILS_FILE = path.join(__dirname, 'toolbox_customer_emails_master.json');
    
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

    let progress = { lastPage: 86408, totalCollected: 0, siteId: 1 };
    if (fs.existsSync(PROGRESS_FILE)) {
        progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        console.log(`Resuming from page ${progress.lastPage}. Total collected so far: ${progress.totalCollected}`);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const loginPage = await context.newPage();

    try {
        console.log('[1] Logging in...');
        await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
        await loginPage.fill('input[name="email"]', 'a.sokolov@smm');
        await loginPage.fill('input[name="password"]', 'Ud5pgC-4uK');
        await loginPage.click('button[type="submit"]');
        await loginPage.waitForSelector('#page-header-user-dropdown', { timeout: 15000 });
        console.log('Login successful.');

        const concurrency = 20; // High concurrency for 1.3M orders
        const batchSize = 1000; // Save every 1000 orders
        let currentBatch = [];
        let uniqueEmails = new Set();
        
        if (fs.existsSync(EMAILS_FILE)) {
            const existing = JSON.parse(fs.readFileSync(EMAILS_FILE, 'utf8'));
            existing.forEach(e => uniqueEmails.add(e));
        }

        const pages = [];
        for (let p = progress.lastPage; p > 0; p--) pages.push(p);

        console.log(`[2] Starting scrape of ${pages.length} pages...`);

        const worker = async (workerId) => {
            const page = await context.newPage();
            // Block images/css for speed
            await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());
            
            while (pages.length > 0) {
                const pageNum = pages.shift();
                if (!pageNum) break;

                const url = `https://panel.smmtoolbox.ru/admin/orders?site_id=${progress.siteId}&page=${pageNum}`;
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
                    
                    const pageData = await page.evaluate(() => {
                        const rows = Array.from(document.querySelectorAll('table tbody tr'));
                        return rows.map(row => {
                            const cells = Array.from(row.querySelectorAll('td'));
                            if (cells.length < 5) return null;
                            const composite = cells[2];
                            if (!composite) return null;

                            const divs = Array.from(composite.querySelectorAll('div'));
                            const getVal = (label) => {
                                const target = divs.find(d => {
                                    const firstStrong = d.querySelector('strong');
                                    return firstStrong && firstStrong.innerText.includes(label);
                                });
                                if (!target) return '-';
                                const a = target.querySelector('a');
                                return a ? a.innerText.trim() : target.innerText.replace(label, '').trim();
                            };

                            const getLink = () => {
                                const target = divs.find(d => {
                                    const firstStrong = d.querySelector('strong');
                                    return firstStrong && firstStrong.innerText.includes('Ссылка:');
                                });
                                if (!target) return '-';
                                const a = target.querySelector('a');
                                return a ? a.href : target.innerText.replace('Ссылка:', '').trim();
                            };

                            return {
                                id: cells[0]?.innerText.trim(),
                                user: cells[1]?.innerText.trim(),
                                category: getVal('Категория:'),
                                activity: getVal('Активность:'),
                                link: getLink(),
                                status: cells[4]?.innerText.trim(),
                                price: cells[3]?.innerText.trim(),
                                date: cells[5]?.innerText.trim()
                            };
                        }).filter(Boolean);
                    });

                    if (pageData.length > 0) {
                        currentBatch.push(...pageData);
                        pageData.forEach(o => { if (o.user && o.user.includes('@')) uniqueEmails.add(o.user.toLowerCase()); });
                        
                        if (currentBatch.length >= batchSize) {
                            const chunkId = Date.now();
                            fs.writeFileSync(path.join(DATA_DIR, `orders_${chunkId}.json`), JSON.stringify(currentBatch, null, 2));
                            progress.totalCollected += currentBatch.length;
                            progress.lastPage = pageNum;
                            fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
                            fs.writeFileSync(EMAILS_FILE, JSON.stringify(Array.from(uniqueEmails), null, 2));
                            
                            console.log(`[Worker ${workerId}] Saved chunk. Total: ${progress.totalCollected}, Last Page: ${progress.lastPage}, Emails: ${uniqueEmails.size}`);
                            currentBatch = [];
                        }
                    }

                } catch (e) {
                    console.error(`Page ${pageNum} error:`, e.message);
                    pages.unshift(pageNum); // Put back for retry
                }
            }
            await page.close();
        };

        const workers = Array.from({ length: concurrency }, (_, i) => worker(i));
        await Promise.all(workers);

        console.log('--- SCRAPING FINISHED ---');

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await browser.close();
    }
}

scrapeAllOrders();
