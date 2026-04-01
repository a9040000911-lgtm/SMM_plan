/**
 * TURBO ORDER SCRAPER v2
 * ======================
 * Playwright → login only (get cookies)
 * Raw HTTP fetch + Cheerio → parse all pages (10-50x faster)
 * 
 * Features:
 *  - Resumable from last page
 *  - Saves every N pages (crash-safe)
 *  - Extracts: orders, emails, links
 *  - Concurrency: 100 HTTP requests
 *  - Memory efficient: streams to disk
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// === CONFIG ===
const SITE_ID = 1;
const CONCURRENCY = 150;         // HTTP requests in parallel (boosted from 80)
const SAVE_EVERY = 500;          // Save progress every N pages
const TIMEOUT_MS = 20000;        // HTTP timeout per request
const MAX_RETRIES = 3;           // Retries per page
const START_PAGE = 86408;        // First page (newest orders)

// Increase built-in fetch max sockets to prevent queuing
const http = require('http');
const https = require('https');
http.globalAgent.maxSockets = 200;
https.globalAgent.maxSockets = 200;
// Note: native 'fetch' might use undici internally, but setting concurrency=150 is the main throttle.

// === PATHS ===
const SCRIPTS_DIR = __dirname;
const PROGRESS_FILE = path.join(SCRIPTS_DIR, 'turbo_scrape_progress.json');
const ORDERS_DIR = path.join(SCRIPTS_DIR, 'turbo_orders_data');
const EMAILS_FILE = path.join(SCRIPTS_DIR, 'turbo_emails.json');
const LINKS_FILE = path.join(SCRIPTS_DIR, 'turbo_links.json');
const SUMMARY_FILE = path.join(SCRIPTS_DIR, 'turbo_scrape_summary.json');

// === STATE ===
let totalOrders = 0;
let totalPages = 0;
let failedPages = [];
const uniqueEmails = new Set();
const uniqueLinks = new Set();
let sessionCookie = '';

async function getSessionCookie() {
    console.log('[1/5] Logging in via HTTP (no browser needed)...');
    
    // Step 1: GET the login page to get CSRF token & initial cookies
    const loginPageRes = await fetch('https://panel.smmtoolbox.ru/admin/login', {
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    // Collect Set-Cookie headers
    const initialCookies = [];
    const setCookieHeaders = loginPageRes.headers.getSetCookie ? loginPageRes.headers.getSetCookie() : [];
    for (const sc of setCookieHeaders) {
        const cookiePart = sc.split(';')[0];
        initialCookies.push(cookiePart);
    }
    
    // Parse CSRF token from HTML
    const loginHtml = await loginPageRes.text();
    const csrfMatch = loginHtml.match(/name="_token"\s+value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';
    
    const cookieStr = initialCookies.join('; ');
    
    // Step 2: POST login credentials
    const formBody = new URLSearchParams({
        _token: csrfToken,
        email: 'a.sokolov@smm',
        password: 'Ud5pgC-4uK'
    });
    
    const loginRes = await fetch('https://panel.smmtoolbox.ru/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookieStr,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://panel.smmtoolbox.ru/admin/login',
            'Origin': 'https://panel.smmtoolbox.ru'
        },
        body: formBody.toString(),
        redirect: 'manual'
    });
    
    // Collect session cookies from login response
    const allCookies = [...initialCookies];
    const loginSetCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
    for (const sc of loginSetCookies) {
        const cookiePart = sc.split(';')[0];
        const cookieName = cookiePart.split('=')[0];
        // Replace or add
        const idx = allCookies.findIndex(c => c.startsWith(cookieName + '='));
        if (idx >= 0) allCookies[idx] = cookiePart;
        else allCookies.push(cookiePart);
    }
    
    sessionCookie = allCookies.join('; ');
    
    // Verify: try to fetch a page
    const verifyRes = await fetch('https://panel.smmtoolbox.ru/admin/orders?site_id=1&page=1', {
        headers: { 'Cookie': sessionCookie, 'User-Agent': 'Mozilla/5.0' },
        redirect: 'manual'
    });
    
    if (verifyRes.status === 200) {
        console.log(`   ✅ Login OK. Session cookie acquired.`);
    } else if (verifyRes.status === 302 || verifyRes.status === 301) {
        throw new Error('Login failed — redirected to login page. Check credentials.');
    } else {
        console.log(`   ⚠️  Login returned status ${verifyRes.status}, proceeding anyway...`);
    }
    
    return sessionCookie;
}

function parseOrdersFromHTML(html) {
    const $ = cheerio.load(html);
    const orders = [];
    
    $('table tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 5) return;
        
        const composite = $(cells[2]);
        
        const getVal = (label) => {
            let val = '-';
            composite.find('div').each((_, div) => {
                const strong = $(div).find('strong').first();
                if (strong.length && strong.text().includes(label)) {
                    const a = $(div).find('a').first();
                    val = a.length ? a.text().trim() : $(div).text().replace(label, '').trim();
                    return false; // break
                }
            });
            return val;
        };
        
        const getLink = () => {
            let link = '-';
            composite.find('div').each((_, div) => {
                const strong = $(div).find('strong').first();
                if (strong.length && strong.text().includes('Ссылка:')) {
                    const a = $(div).find('a').first();
                    link = a.length ? (a.attr('href') || a.text().trim()) : $(div).text().replace('Ссылка:', '').trim();
                    return false;
                }
            });
            return link;
        };
        
        // Provider info
        let provider = '-';
        let providerComment = '-';
        const additionalData = composite.find('.additional-data');
        if (additionalData.length) {
            additionalData.find('div').each((_, d) => {
                const text = $(d).text().replace(/\s+/g, ' ').trim();
                if (text.includes('Провайдер:')) provider = text.replace('Провайдер:', '').trim();
                if (text.includes('Комментарий провайдера:')) providerComment = text.replace('Комментарий провайдера:', '').trim();
            });
        }
        
        const order = {
            id: $(cells[0]).text().trim(),
            user: $(cells[1]).text().trim(),
            category: getVal('Категория:'),
            activity: getVal('Активность:'),
            service: getVal('Сервис:'),
            link: getLink(),
            amount: getVal('Кол-во:'),
            status: $(cells[4]).text().trim(),
            price: $(cells[3]).text().trim(),
            date: $(cells[5]).text().trim(),
            provider,
            providerComment
        };
        
        orders.push(order);
    });
    
    return orders;
}

async function fetchPage(pageNum) {
    const url = `https://panel.smmtoolbox.ru/admin/orders?site_id=${SITE_ID}&page=${pageNum}`;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
            
            const res = await fetch(url, {
                headers: {
                    'Cookie': sessionCookie,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'ru-RU,ru;q=0.9',
                },
                signal: controller.signal,
                redirect: 'manual' // Don't follow redirects (login redirect = session expired)
            });
            
            clearTimeout(timeoutId);
            
            // If redirected to login — session expired
            if (res.status === 302 || res.status === 301) {
                throw new Error('SESSION_EXPIRED');
            }
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            
            const html = await res.text();
            return parseOrdersFromHTML(html);
            
        } catch (err) {
            if (err.message === 'SESSION_EXPIRED') throw err;
            if (attempt === MAX_RETRIES) {
                return null; // Give up on this page
            }
            // Brief wait before retry
            await new Promise(r => setTimeout(r, 500 * attempt));
        }
    }
    return null;
}

function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        console.log(`   Resuming: lastPage=${p.lastPage}, orders=${p.totalOrders}, emails=${p.totalEmails}`);
        return p;
    }
    return { lastPage: START_PAGE, totalOrders: 0, totalEmails: 0, totalLinks: 0 };
}

function saveProgress(lastPage) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        lastPage,
        totalOrders,
        totalEmails: uniqueEmails.size,
        totalLinks: uniqueLinks.size,
        updatedAt: new Date().toISOString()
    }, null, 2));
    
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(Array.from(uniqueEmails), null, 2));
    fs.writeFileSync(LINKS_FILE, JSON.stringify(Array.from(uniqueLinks), null, 2));
}

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║   TURBO ORDER SCRAPER v2             ║');
    console.log('║   HTTP + Cheerio (no browser render)  ║');
    console.log('╚══════════════════════════════════════╝\n');
    
    // Step 1: Login
    await getSessionCookie();
    
    // Step 2: Load state
    const progress = loadProgress();
    if (!fs.existsSync(ORDERS_DIR)) fs.mkdirSync(ORDERS_DIR, { recursive: true });
    
    // Load existing emails/links
    if (fs.existsSync(EMAILS_FILE)) {
        JSON.parse(fs.readFileSync(EMAILS_FILE, 'utf8')).forEach(e => uniqueEmails.add(e));
    }
    if (fs.existsSync(LINKS_FILE)) {
        JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8')).forEach(l => uniqueLinks.add(l));
    }
    totalOrders = progress.totalOrders;
    
    // Step 3: Build page list (descending from last saved page to 1)
    const allPages = [];
    for (let p = progress.lastPage; p >= 1; p--) allPages.push(p);
    
    console.log(`[2/5] Pages to scrape: ${allPages.length} (from ${progress.lastPage} to 1)`);
    console.log(`[3/5] Concurrency: ${CONCURRENCY} parallel HTTP requests\n`);
    
    const startTime = Date.now();
    let pagesProcessed = 0;
    let currentBatch = [];
    let lowestPage = progress.lastPage;
    let sessionValid = true;
    
    // Worker pool
    const worker = async () => {
        while (allPages.length > 0 && sessionValid) {
            const pageNum = allPages.shift();
            if (!pageNum) break;
            
            try {
                const orders = await fetchPage(pageNum);
                
                if (orders === null) {
                    failedPages.push(pageNum);
                    pagesProcessed++;
                    continue;
                }
                
                // Collect data
                for (const o of orders) {
                    if (o.user && o.user.includes('@')) {
                        uniqueEmails.add(o.user.toLowerCase().trim());
                    }
                    if (o.link && o.link !== '-' && o.link.startsWith('http')) {
                        uniqueLinks.add(o.link);
                    }
                }
                
                currentBatch.push(...orders);
                totalOrders += orders.length;
                pagesProcessed++;
                
                if (pageNum < lowestPage) lowestPage = pageNum;
                
                // Progress log every 100 pages
                if (pagesProcessed % 100 === 0) {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                    const rate = (pagesProcessed / (elapsed || 1)).toFixed(1);
                    const eta = ((allPages.length / (rate || 1)) / 60).toFixed(0);
                    console.log(
                        `   📊 Pages: ${pagesProcessed}/${pagesProcessed + allPages.length} | ` +
                        `Orders: ${totalOrders} | Emails: ${uniqueEmails.size} | Links: ${uniqueLinks.size} | ` +
                        `Speed: ${rate} p/s | ETA: ${eta}min | Failed: ${failedPages.length}`
                    );
                }
                
                // Save checkpoint
                if (pagesProcessed % SAVE_EVERY === 0 && currentBatch.length > 0) {
                    const chunkFile = path.join(ORDERS_DIR, `orders_${Date.now()}.json`);
                    fs.writeFileSync(chunkFile, JSON.stringify(currentBatch));
                    saveProgress(lowestPage);
                    console.log(`   💾 Saved ${currentBatch.length} orders to chunk. Progress saved.`);
                    currentBatch = [];
                }
                
            } catch (err) {
                if (err.message === 'SESSION_EXPIRED') {
                    console.error('\n   ❌ SESSION EXPIRED! Saving progress and stopping...');
                    sessionValid = false;
                    break;
                }
                failedPages.push(pageNum);
                pagesProcessed++;
            }
        }
    };
    
    // Launch workers
    console.log(`[4/5] 🚀 Launching ${CONCURRENCY} workers...\n`);
    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);
    
    // Save remaining batch
    if (currentBatch.length > 0) {
        const chunkFile = path.join(ORDERS_DIR, `orders_${Date.now()}.json`);
        fs.writeFileSync(chunkFile, JSON.stringify(currentBatch));
    }
    saveProgress(lowestPage);
    
    // Step 5: Final summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(0);
    const summary = {
        totalOrders,
        uniqueEmails: uniqueEmails.size,
        uniqueLinks: uniqueLinks.size,
        pagesProcessed,
        failedPages: failedPages.length,
        durationSeconds: parseInt(duration),
        avgSpeed: (pagesProcessed / (duration || 1)).toFixed(1) + ' pages/sec',
        stoppedAt: lowestPage,
        completedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
    
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║         SCRAPING COMPLETE            ║');
    console.log('╚══════════════════════════════════════╝');
    console.log(`   📦 Total Orders:   ${totalOrders}`);
    console.log(`   📧 Unique Emails:  ${uniqueEmails.size}`);
    console.log(`   🔗 Unique Links:   ${uniqueLinks.size}`);
    console.log(`   📄 Pages Done:     ${pagesProcessed}`);
    console.log(`   ❌ Failed Pages:   ${failedPages.length}`);
    console.log(`   ⏱️  Duration:      ${duration}s`);
    console.log(`   🚀 Avg Speed:      ${summary.avgSpeed}`);
    console.log(`   📁 Data saved to:  ${ORDERS_DIR}`);
    console.log(`   📧 Emails:         ${EMAILS_FILE}`);
    console.log(`   🔗 Links:          ${LINKS_FILE}`);
    
    // Save failed pages for retry
    if (failedPages.length > 0) {
        const failedFile = path.join(SCRIPTS_DIR, 'turbo_failed_pages.json');
        fs.writeFileSync(failedFile, JSON.stringify(failedPages));
        console.log(`   ⚠️  Failed pages saved to: ${failedFile}`);
    }
}

main().catch(err => {
    console.error('FATAL:', err);
    // Save what we have
    try { saveProgress(0); } catch(e) {}
    process.exit(1);
});
