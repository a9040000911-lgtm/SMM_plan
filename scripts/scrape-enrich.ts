import puppeteer from 'puppeteer-core';
import * as fs from 'fs';

async function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function scrapeDetails() {
    const rawData = JSON.parse(fs.readFileSync('scripts/smmtoolbox_parsed.json', 'utf8'));
    console.log(`Loaded ${rawData.length} services to enrich...`);

    const browser = await puppeteer.launch({ 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
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
    }

    const detailedServices = [];

    for (let i = 0; i < rawData.length; i++) {
        const item = rawData[i];
        if (!item.editUrl) continue;
        
        console.log(`[${i+1}/${rawData.length}] На парсинг: Service ID ${item.id}`);
        await page.goto(item.editUrl, { waitUntil: 'domcontentloaded' });
        
        // Wait for inputs to render
        try { await page.waitForSelector('input[name="provider_service_id"], select[name="provider_id"]', { timeout: 3000 }); } catch(e) {}
        
        const details = await page.evaluate(() => {
            // Find "Сервис провайдера" field. Usually has value "1912 (32025) | Facebook members..."
            // It could be an input or select
            const providerServiceSelect = document.querySelector('select[name="provider_service_id"]');
            let providerServiceText = '';
            if (providerServiceSelect) {
                const selected = providerServiceSelect.options[providerServiceSelect.selectedIndex];
                if (selected) providerServiceText = selected.innerText;
            } else {
                const selectElement = Array.from(document.querySelectorAll('label')).find(l => l.innerText.includes('Сервис провайдера'));
                if (selectElement && selectElement.nextElementSibling) {
                    const input = selectElement.nextElementSibling.querySelector('input, select');
                    if (input) providerServiceText = input.value || input.innerText;
                }
            }

            // Fallback - find text in the DOM like "1912 (32025)"
            if (!providerServiceText || providerServiceText.length < 2) {
                 const texts = document.body.innerText;
                 const match = texts.match(/(\d+) \(\d+\) \|/);
                 if (match) providerServiceText = match[0];
            }

            // Get description from textarea
            let description = '';
            const descArea = document.querySelector('textarea[name="description"]') || document.querySelector('textarea#description');
            if (descArea) {
                description = (descArea as HTMLTextAreaElement).value;
            }

            return { providerServiceText, description };
        });

        // Extract 1912 and 32025
        // Example: "1912 (32025) | Facebook members"
        let remoteServiceId = null;
        let remoteProviderId = null;
        
        if (details.providerServiceText) {
            const regex = /^(\d+)\s*\((\d+)\)/;
            const match = details.providerServiceText.trim().match(regex);
            if (match) {
                remoteServiceId = match[1];
                remoteProviderId = match[2];
            }
        }

        detailedServices.push({
            ...item,
            ...(details.description ? { description: details.description } : {}),
            remoteServiceId,
            remoteProviderId,
            rawProviderServiceText: details.providerServiceText
        });
        
        await delay(500); // polite matching
    }

    fs.writeFileSync('scripts/smmtoolbox_enriched.json', JSON.stringify(detailedServices, null, 2), 'utf8');
    console.log('✅ Обогащенные данные сохранены в scripts/smmtoolbox_enriched.json');
    await browser.close();
}

scrapeDetails().catch(e => { console.error('Ошибка:', e); process.exit(1); });
