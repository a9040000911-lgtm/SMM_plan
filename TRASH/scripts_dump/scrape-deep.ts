import puppeteer from 'puppeteer';
import * as fs from 'fs';

async function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function scrapeDeep() {
    const browser = await puppeteer.launch({ 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        defaultViewport: { width: 1920, height: 1080 } 
    });
    
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    
    console.log('Авторизация a.sokolov...');
    await page.goto('https://panel.smmtoolbox.ru/admin/login', { waitUntil: 'load' });

    const emailInput = await page.$('input[name="email"]') || await page.$('input[type="email"]');
    const passInput = await page.$('input[name="password"]') || await page.$('input[type="password"]');
    
    if (emailInput && passInput) {
        await emailInput.type('a.sokolov@smm');
        await passInput.type('Ud5pgC-4uK');
        
        const submit = await page.$('button[type="submit"]') || await page.$('input[type="submit"]');
        if (submit) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                submit.click(),
            ]);
            console.log('Успешный вход.');
        }
    } else {
        console.log('Не найдены поля логина. Возможно, уже авторизован?');
    }

    const servicesList: { id: string, cols: string[] }[] = [];

    const baseUrl = `https://panel.smmtoolbox.ru/admin/services?site_id=1&per_page=500&id=&name=&category_id=&activity_id=&provider_id=&provider_service_id=&active=true&api_status=true`;

    console.log('1. Собираем ID всех услуг по страницам (ожидаем 17 страниц)...');
    
    // Как попросил юзер: 17 страниц (выставим лимит 20 на случай новых услуг)
    for (let pageNum = 1; pageNum <= 20; pageNum++) {
        const url = `${baseUrl}&page=${pageNum}`;
        console.log(`Сканируем страницу ${pageNum}...`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        await delay(1000); // give it a little rest
        
        const rows = await page.$$eval('table tbody tr', trs => {
            return trs.map(tr => {
                const tds = Array.from(tr.querySelectorAll('td'));
                if (tds.length < 5) return null; 
                return {
                    id: tds[0].innerText.trim(),
                    cols: tds.map(td => td.innerText.replace(/\n/g, ' | ').trim())
                };
            }).filter(row => row !== null && row.id && !isNaN(parseInt(row.id))); // must have a numeric ID
        });

        if (rows.length === 0) {
            console.log(`На странице ${pageNum} больше нет услуг.`);
            break; // конец пагинации
        }
        
        servicesList.push(...(rows as any));
        console.log(`Собрано ${rows.length} ID. Всего в списке: ${servicesList.length}`);
    }

    console.log(`\n========================================`);
    console.log(`Сбор базовых данных завершен. Найдено ID: ${servicesList.length}`);
    console.log(`2. Теперь заходим внутрь КАЖДОЙ услуги для сбора Провайдеров!`);
    console.log(`========================================\n`);

    const finalData: any[][] = [];
    
    // Concurrent runner helper
    async function processItem(item: any, workerPage: any, index: number) {
        console.log(`[${index+1}/${servicesList.length}] Заходим в услугу ID: ${item.id}...`);
        const urlShort = `https://panel.smmtoolbox.ru/admin/services/${item.id}/short?site_id=1`;
        
        try {
            await workerPage.goto(urlShort, { waitUntil: 'domcontentloaded' });
            
            const innerDetails = await workerPage.evaluate(() => {
                let providerVal = '';
                let providerText = '';
                let providerServiceId = '';
                
                const providerSelect = document.querySelector('select[name="provider_id"]') as HTMLSelectElement;
                if (providerSelect && providerSelect.options) {
                    providerVal = providerSelect.value;
                    const selectedOpt = Array.from(providerSelect.options).find(o => o.selected);
                    if (selectedOpt) providerText = selectedOpt.textContent?.trim() || '';
                } else {
                    const provEl = Array.from(document.querySelectorAll('.form-group, div')).find(el => el.textContent?.includes('Provider:'));
                    if (provEl) providerText = provEl.textContent?.replace('Provider:', '').trim() || '';
                }

                const serviceInput = document.querySelector('input[name="provider_service_id"]') as HTMLInputElement;
                if (serviceInput) {
                    providerServiceId = serviceInput.value;
                } else {
                    const servEl = Array.from(document.querySelectorAll('.form-group, div')).find(el => el.textContent?.includes('Service ID'));
                    if (servEl) providerServiceId = servEl.textContent?.trim() || '';
                }
                
                const priceBadge = document.querySelector('#provider_price_badge') || document.querySelector('.provider_price');
                const providerPrice = priceBadge ? priceBadge.textContent?.trim() : '';

                return { providerVal, providerText, providerServiceId, providerPrice };
            });

            return [
                ...item.cols,
                innerDetails.providerText,
                innerDetails.providerVal,
                innerDetails.providerServiceId,
                innerDetails.providerPrice
            ];

        } catch (e: any) {
            console.error(`Ошибка при скрапинге услуги ${item.id}:`, e.message);
            return [...item.cols, 'ERROR', 'ERROR', 'ERROR', 'ERROR'];
        }
    }

    const CONCURRENCY = 10;
    const workerPages = [];
    // Open 10 pages and copy cookies/session from main page
    console.log(`Создаем ${CONCURRENCY} потоков (вкладок) браузера...`);
    for (let i = 0; i < CONCURRENCY; i++) {
        const p = await browser.newPage();
        workerPages.push(p);
    }
    
    let currentIndex = 0;
    
    const workers = workerPages.map(async (wpage, wIdx) => {
        while (true) {
            const tempIndex = currentIndex++;
            if (tempIndex >= servicesList.length) break;
            const res = await processItem(servicesList[tempIndex], wpage, tempIndex);
            finalData.push(res);
        }
    });
    
    await Promise.all(workers);

    console.log(`\nГлубокий парсинг окончен. Сохраняю в файл...`);

    if (finalData.length > 0) {
        const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
        const csvLines = finalData.map(row => row.map((c: any) => escapeCsv(String(c))).join(';'));
        
        // Создаем заголовки
        const baseCols = servicesList[0].cols.map((_, idx) => `База_${idx+1}`);
        const headers = [...baseCols, 'Provider_Name', 'SMMToolbox_ProviderID', 'Remote_Provider_Service_ID', 'Remote_Price'].join(';');
        
        fs.writeFileSync('smmtoolbox_DEEP_export.csv', '\uFEFF' + headers + '\n' + csvLines.join('\n'), 'utf8'); // BOM
        console.log('Готово! Данные сохранены в smmtoolbox_DEEP_export.csv');
    }

    await browser.close();
}

scrapeDeep().catch(err => {
    console.error('Критическая ошибка:', err);
    process.exit(1);
});
