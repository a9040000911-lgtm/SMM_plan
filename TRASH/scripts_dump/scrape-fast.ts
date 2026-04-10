import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as https from 'https';

const EMAIL = 'a.sokolov@smm';
const PASS = 'Ud5pgC-4uK';
const BASE_URL = 'https://panel.smmtoolbox.ru';

const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }), // just in case
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    }
});

let sessionCookies: string[] = [];

function getCookieString() {
    return sessionCookies.map(c => c.split(';')[0]).join('; ');
}

async function login() {
    console.log('1. Запрашиваем страницу логина для получения CSRF токена...');
    const getRes = await client.get('/admin/login');
    
    // Save cookies
    if (getRes.headers['set-cookie']) {
        sessionCookies = getRes.headers['set-cookie'];
    }

    const $ = cheerio.load(getRes.data);
    const csrfToken = $('meta[name="csrf-token"]').attr('content') || $('input[name="_token"]').val();

    if (!csrfToken) throw new Error('CSRF токен не найден!');

    console.log('2. Авторизация...');
    const formData = new URLSearchParams();
    formData.append('_token', csrfToken as string);
    formData.append('email', EMAIL);
    formData.append('password', PASS);

    const postRes = await client.post('/admin/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': `${BASE_URL}/admin/login`,
            'Cookie': getCookieString()
        },
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400
    });

    if (postRes.headers['set-cookie']) {
        sessionCookies.push(...postRes.headers['set-cookie']);
    }

    console.log('Успешная авторизация (получены куки сессии).');
}

async function fetchIds() {
    console.log('3. Собираем ID всех услуг...');
    const ids: { id: string, cols: string[] }[] = [];
    
    // 18 страниц, грузим их параллельно для скорости
    const listRequests = Array.from({length: 18}, (_, i) => i + 1).map(async page => {
        try {
            const url = `/admin/services?site_id=1&per_page=500&id=&name=&category_id=&activity_id=&provider_id=&provider_service_id=&active=true&api_status=true&page=${page}`;
            const res = await client.get(url, { headers: { Cookie: getCookieString() } });
            const $ = cheerio.load(res.data);
            
            const rows: any[] = [];
            $('table tbody tr').each((i, tr) => {
                const tds = $(tr).find('td');
                if (tds.length < 5) return;
                
                const id = $(tds[0]).text().trim();
                const cols = [];
                tds.each((j, td) => cols.push($(td).text().replace(/\n/g, ' | ').trim()));
                
                if (id && !isNaN(parseInt(id))) rows.push({ id, cols });
            });
            return rows;
        } catch (e) {
            console.error(`Ошибка на странице ${page}:`, e.message);
            return [];
        }
    });

    const results = await Promise.all(listRequests);
    results.forEach(pageRows => ids.push(...pageRows));
    
    console.log(`Найдено уникальных услуг: ${ids.length}`);
    return ids;
}

// Запуск задач пачками по concurrentLimit
async function processInBatches(items, concurrentLimit) {
    console.log(`4. Начинаем скоростной парсинг внутренних страниц (по ${concurrentLimit} потоков).`);
    const results = [];
    
    let activePromises = [];
    let completed = 0;

    for (const item of items) {
        const p = client.get(`/admin/services/${item.id}/short?site_id=1`, { headers: { Cookie: getCookieString() } })
            .then(res => {
                const $ = cheerio.load(res.data);
                
                // Ищем Provider (Select или Input)
                let providerVal = $('select[name="provider_id"] option:selected').val() || '';
                let providerText = $('select[name="provider_id"] option:selected').text() || '';
                if (!providerText) {
                    // Если нет select, ищем в тексте
                    $(':contains("Provider:")').each((_, el) => {
                       providerText = $(el).text().replace('Provider:', '').trim(); 
                    });
                }
                
                let providerServiceId = $('input[name="provider_service_id"]').val() || '';
                let providerPrice = $('#provider_price_badge, .provider_price').first().text().trim() || '';

                results.push([
                    ...item.cols,
                    providerText,
                    providerVal,
                    providerServiceId,
                    providerPrice
                ]);
                
                completed++;
                if (completed % 50 === 0) console.log(`Обработано: ${completed}/${items.length}`);
            })
            .catch(err => {
                console.error(`Ошибка при /admin/services/${item.id}:`, err.message);
                results.push([...item.cols, 'ERROR', 'ERROR', 'ERROR', 'ERROR']);
            });

        activePromises.push(p);

        if (activePromises.length >= concurrentLimit) {
            await Promise.race(activePromises);
            activePromises = activePromises.filter(p => {
                let isPending = true;
                p.then(() => isPending = false).catch(() => isPending = false);
                return isPending;
            });
        }
    }
    
    await Promise.all(activePromises);
    return results;
}

async function run() {
    try {
        await login();
        let services = await fetchIds();
        
        // Удалим дубли если пагинация перекрывалась
        const unique = [];
        const seen = new Set();
        for (const s of services) {
            if (!seen.has(s.id)) {
                seen.add(s.id);
                unique.push(s);
            }
        }
        services = unique;
        
        const finalData = await processInBatches(services, 10); // 10 потоков
        
        console.log(`\nСохранение CSV...`);
        if (finalData.length > 0) {
            const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
            const csvLines = finalData.map(row => row.map(c => escapeCsv(String(c))).join(';'));
            
            const maxCols = Math.max(...finalData.map(r => r.length));
            let headersList = Array.from({length: maxCols - 4}, (_, i) => `Col_${i+1}`);
            headersList.push('Provider_Name', 'SMMToolbox_ProviderID', 'Remote_Provider_Service_ID', 'Remote_Price');
            
            const headers = headersList.join(';');
            fs.writeFileSync('smmtoolbox_FAST_export.csv', '\uFEFF' + headers + '\n' + csvLines.join('\n'), 'utf8');
            console.log('ГОТОВО! Данные сохранены в smmtoolbox_FAST_export.csv');
        }

    } catch (e) {
        console.error('Ошибка в скрипте:', e);
    }
}

run();
