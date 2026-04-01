// @ts-nocheck
import puppeteer from 'puppeteer-core';
import * as fs from 'fs';

async function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function scrape() {
    console.log('Запуск браузера...');
    const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        defaultViewport: { width: 1920, height: 1080 } 
    });
    
    const page = await browser.newPage();
    
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

    const allServices: any[] = [];
    let pageNum = 1;
    let hasNext = true;
    let lastDataHash = '';

    // Включаем 500 на страницу и фильтр по активным услугам, как попросил пользователь
    const baseUrl = `https://panel.smmtoolbox.ru/admin/services?site_id=1&per_page=500&id=&name=&category_id=&activity_id=&provider_id=&provider_service_id=`;

    while (hasNext) {
        const url = `${baseUrl}&page=${pageNum}`;
        console.log(`\nОткрываем страницу ${pageNum}: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Подождем таблицу
        try { await page.waitForSelector('table tbody tr', { timeout: 10000 }); } catch (e) {
            console.log('Таблица не найдена или пустая.');
            break;
        }

        const rows = await page.$$eval('table tbody tr', trs => {
            return trs.map(tr => {
                const tds = Array.from(tr.querySelectorAll('td'));
                if (tds.length < 5) return null; // пропускаем шапки или пустые ряды
                
                // В SmartPanel / PerfectPanel столбцы обычно разложены блоками.
                // Мы спарсим весь текст колонок для надежности.
                // И поищем ID провайдеров через скрытые или мелкие шрифты, 
                // типичные для таких админок: 'Vexboost', 'ID: 1234'
                return tds.map(td => {
                    // Удаляем лишние переносы и чистим текст
                    return td.innerText.replace(/\n/g, ' | ').trim();
                });
            }).filter(row => row !== null);
        });

        if (rows.length === 0) {
            hasNext = false;
            console.log('Данных нет. Конец парсинга.');
            break;
        }

        console.log(`Спарсено ${rows.length} строк.`);
        allServices.push(...rows);

        // Проверка: получили ли мы те же самые данные, что и на прошлой странице (обычно Laravel так делает, когда страница за пределами лимита)
        const currentDataHash = rows.map(r => r.join('')).join('');
        if (currentDataHash === lastDataHash) {
            console.log('Данные совпали с прошлой страницей. Считаем, что это конец.');
            hasNext = false;
        } else {
            lastDataHash = currentDataHash;
            pageNum++;
            await delay(2000);
        }
        
        // Safety switch for endless loop
        if (pageNum > 100) break;
    }
    
    console.log(`\nИтого собрано ${allServices.length} услуг.`);
    
    if (allServices.length > 0) {
        const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
        const csvLines = allServices.map(row => row.map((c: any) => escapeCsv(c)).join(';'));
        
        // Добавляем заголовки колонок в виде "Колонка 1; Колонка 2; ..."
        const maxCols = Math.max(...allServices.map(r => r.length));
        const headers = Array.from({length: maxCols}, (_, i) => `Col_${i+1}`).join(';');
        
        fs.writeFileSync('smmtoolbox_reference_FULL.csv', '\uFEFF' + headers + '\n' + csvLines.join('\n'), 'utf8'); // BOM (UTF-8 with BOM) для Excel
        console.log('Данные сохранены в smmtoolbox_reference_FULL.csv (Разделитель - точка с запятой для Excel)');
    }
    
    await browser.close();
}

scrape().catch(err => {
    console.error('Критическая ошибка:', err);
    process.exit(1);
});
