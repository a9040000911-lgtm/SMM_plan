import { chromium } from 'playwright';
import fs from 'fs';

async function scrape() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Navigating to login page...');
        await page.goto('https://panel.smmtoolbox.ru/admin/login');

        console.log('Entering credentials...');
        await page.fill('input[name="email"]', 'a.sokolov@smm');
        await page.fill('input[name="password"]', 'Ud5pgC-4uK');
        await page.click('button[type="submit"]');

        await page.waitForSelector('#page-header-user-dropdown', { timeout: 15000 });
        console.log('Logged in successfully!');

        const targetUrl = 'https://panel.smmtoolbox.ru/admin/services?site_id=16&id=&name=&category_id=&activity_id=&provider_id=&provider_service_id=&active=true&api_status=true';
        console.log(`Navigating to target services page (site_id=16)...`);
        await page.goto(targetUrl, { waitUntil: 'load' });

        console.log(`Current URL: ${page.url()}`);

        // Попробуем подождать именно таблицу услуг
        console.log('Waiting for services table...');
        try {
            await page.waitForSelector('table', { timeout: 20000 });
        } catch (e) {
            console.log('Table not found, saving HTML for debug.');
            const html = await page.content();
            fs.writeFileSync('debug_no_table.html', html);
            throw e;
        }

        console.log('Extracting services data...');
        const data = await page.evaluate(() => {
            // Ищем таблицу, которая содержит заголовки про услуги
            const tables = Array.from(document.querySelectorAll('table'));
            const serviceTable = tables.find(t => t.innerText.includes('ID') && t.innerText.includes('Стоимость'));

            if (!serviceTable) {
                // Если не нашли по тексту, берем просто первую крупную таблицу
                const rows = document.querySelectorAll('#main-container table tbody tr');
                return Array.from(rows).map(row => {
                    const cols = row.querySelectorAll('td');
                    return {
                        id: cols[0]?.innerText.trim(),
                        name: cols[2]?.innerText.trim(),
                        category: cols[3]?.innerText.trim(),
                        provider: cols[4]?.innerText.trim(),
                        cost: cols[5]?.innerText.trim(),
                        status: cols[6]?.innerText.trim(),
                        raw: Array.from(cols).map(c => c.innerText.trim())
                    };
                });
            }

            const rows = serviceTable.querySelectorAll('tbody tr');
            return Array.from(rows).map(row => {
                const cols = row.querySelectorAll('td');
                return {
                    id: cols[0]?.innerText.trim(),
                    name: cols[2]?.innerText.trim(),
                    category: cols[3]?.innerText.trim(),
                    provider: cols[4]?.innerText.trim(),
                    cost: cols[5]?.innerText.trim(),
                    status: cols[6]?.innerText.trim(),
                    raw: Array.from(cols).map(c => c.innerText.trim())
                };
            });
        });

        if (data && data.length > 0) {
            console.log(`Successfully scraped ${data.length} items.`);
            fs.writeFileSync('smmtoolbox_services_16_v2.json', JSON.stringify(data, null, 2));
            console.log('Data saved to smmtoolbox_services_16_v2.json');
        } else {
            console.log('No data extracted.');
            const html = await page.content();
            fs.writeFileSync('debug_empty_data.html', html);
        }

    } catch (error) {
        console.error('Error during scraping:', error);
        const html = await page.content();
        fs.writeFileSync('debug_error_final.html', html);
    } finally {
        await browser.close();
    }
}

scrape();
