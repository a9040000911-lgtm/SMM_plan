const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('⏳ Запуск парсера Smmtoolbox (Instagram/category_id=2)...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🔑 Авторизация...');
        await page.goto('https://panel.smmtoolbox.ru/admin/login', { waitUntil: 'networkidle' });
        await page.fill('input[name=\"email\"]', 'a.sokolov@smm');
        await page.fill('input[name=\"password\"]', 'Ud5pgC-4uK');
        await page.click('button[type=\"submit\"]');
        await page.waitForSelector('#page-header-user-dropdown', { timeout: 15000 });
        console.log('✅ Успешная авторизация!');

        const targetUrl = 'https://panel.smmtoolbox.ru/admin/services?site_id=1&name=&category_id=&active=true&api_status=true';
        console.log(`🌐 Переход по ссылке: ${targetUrl}`);
        
        await page.goto(targetUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('table', { timeout: 15000 });
        
        let currentPage = 1;
        const allServices = [];

        while (currentPage <= 50) {
            const pageUrl = `${targetUrl}&page=${currentPage}`;
            console.log(`🌐 Скрапинг страницы ${currentPage}... (${pageUrl})`);
            await page.goto(pageUrl, { waitUntil: 'networkidle' });
            await page.waitForSelector('table', { timeout: 15000 });

            const servicesOnPage = await page.evaluate(() => {
                const rows = document.querySelectorAll('table tbody tr');
                if (rows.length === 0) return [];
                
                // If there's a row saying "No data"
                const firstRowText = rows[0].innerText.toLowerCase();
                if (firstRowText.includes('no data') || firstRowText.includes('нет данных')) return [];

                return Array.from(rows).map(row => {
                    const cols = row.querySelectorAll('td');
                    return {
                        id: cols[0]?.innerText.trim(),
                        platform: cols[2]?.innerText.trim(),
                        category: cols[3]?.innerText.trim(),
                        rawNameProvider: cols[4]?.innerText.trim(),
                        cost: cols[5]?.innerText.trim(),
                        allCols: Array.from(cols).map(c => c.innerText.trim()),
                        editUrl: cols[0]?.innerText.trim() ? `https://panel.smmtoolbox.ru/admin/services/${cols[0]?.innerText.trim()}?site_id=1` : null
                    };
                }).filter(item => item.id && item.id.length > 0 && !isNaN(parseInt(item.id)));
            });

            if (servicesOnPage.length === 0) {
                console.log(`Страница ${currentPage} пуста, завершаем пагинацию.`);
                break;
            }

            allServices.push(...servicesOnPage);
            
            const hasNext = await page.evaluate(() => {
                const nextBtn = document.querySelector('li.page-item.active + li.page-item:not(.disabled) a');
                return !!nextBtn;
            });

            if (!hasNext) {
                console.log(`Достигнута последняя страница: ${currentPage}`);
                break;
            }
            currentPage++;
        }

        console.log(`✅ Найдено всего ${allServices.length} услуг. Начинаем извлекать описания...`);

        // Извлекаем описания
        for (let i = 0; i < allServices.length; i++) {
            if (allServices[i].editUrl) {
                try {
                    await page.goto(allServices[i].editUrl, { waitUntil: 'domcontentloaded' });
                    const description = await page.evaluate(() => {
                        const selectors = [
                            'textarea[name=\"description\"]',
                            '#description',
                            '.block-content textarea',
                            'div.form-group:has(label:text(\"Описание\")) div'
                        ];
                        for (const sel of selectors) {
                            const el = document.querySelector(sel);
                            if (el) return el.value || el.innerText || '';
                        }
                        return '';
                    });
                    allServices[i].description = description.trim();
                    process.stdout.write('.');
                } catch(e) {
                    console.log(`\nОшибка извлечения описания для ID ${allServices[i].id}`);
                    allServices[i].description = '';
                }
            } else {
                allServices[i].description = '';
            }
        }

        const services = allServices;

        console.log('\n💾 Сохранение в smmtoolbox_parsed.json...');
        fs.writeFileSync('D:/Smmplan/scripts/smmtoolbox_parsed.json', JSON.stringify(services, null, 2), 'utf-8');
        console.log('✅ Готово!');

    } catch (e) {
        console.error('❌ Ошибка:', e);
    } finally {
        await browser.close();
    }
})();
