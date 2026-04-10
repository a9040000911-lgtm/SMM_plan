import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, 'turbo_markups_raw.json');

async function scrapeAdminMarkups() {
    console.log('🚀 Запуск Playwright Chromium (Сбор наценок)...');
    
    // Launch visible browser so we can debug Nginx blocks if they happen
    const browser = await chromium.launch({ headless: false }); 
    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('🔓 Авторизация в Админ-панели...');
    await page.goto('https://panel.smmtoolbox.ru/admin/login', { waitUntil: 'domcontentloaded' });
    
    // SmartPanel default login form inputs
    const emailInput = await page.$('input[type="email"], input[name*="email"], #email');
    if (emailInput) await emailInput.fill('a.sokolov@smm');

    const passInput = await page.$('input[type="password"], input[name*="password"], #password');
    if (passInput) await passInput.fill('Ud5pgC-4uK');
    
    const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
        await submitBtn.click();
        console.log('Ожидание входа (Network Idle)...');
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => console.log('Слишком долгий idle, продолжаем...'));
    }

    console.log('Переход в раздел Услуги (Services)...');
    await page.goto('https://panel.smmtoolbox.ru/admin/services?site_id=1', { waitUntil: 'domcontentloaded' });
    // Wait for the table to appear
    await page.waitForSelector('table', { timeout: 10000 }).catch(() => console.log('Таблица не загрузилась мгновенно'));

    let hasNextPage = true;
    const allServicesData: string[] = [];
    let pageNum = 1;

    while (hasNextPage) {
        console.log(`📡 Сканируем страницу [${pageNum}]...`);
        
        const rowsText = await page.evaluate(() => {
            const rows = document.querySelectorAll('table tbody tr');
            const data: string[] = [];
            rows.forEach(tr => {
                const cleanText = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim().replace(/\n/g, ' ')).join(' | ');
                data.push(cleanText);
            });
            return data;
        });

        allServicesData.push(...rowsText);
        console.log(`Найдено ${rowsText.length} услуг на странице ${pageNum}`);

        // Try to find the next active pagination button
        const nextLink = await page.evaluate(() => {
            const activeLi = document.querySelector('ul.pagination li.active');
            if (activeLi && activeLi.nextElementSibling) {
                const a = activeLi.nextElementSibling.querySelector('a');
                if (a && a.getAttribute('href') && !a.getAttribute('href').includes('#') && !activeLi.nextElementSibling.classList.contains('disabled')) {
                    return a.getAttribute('href');
                }
            }
            return null;
        });

        if (nextLink) {
            const nextUrl = new URL(nextLink, page.url()).toString();
            console.log(`Переход на следующую страницу: ${nextUrl}`);
            await page.goto(nextUrl, { waitUntil: 'domcontentloaded' });
            pageNum++;
            await page.waitForTimeout(1000); // polite delay
        } else {
            console.log('Достигнута последняя страница пагинации.');
            hasNextPage = false;
        }
    }

    console.log(`\n✅ Парсинг завершен! Собрано ${allServicesData.length} строк/услуг.`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allServicesData, null, 2));
    console.log(`Данные сохранены в: ${OUTPUT_FILE}`);

    await browser.close();
}

scrapeAdminMarkups().catch(err => {
    console.error('Ошибка в Playwright:', err);
    process.exit(1);
});
