import fs from 'fs';

async function fastScrape() {
    const rawData = JSON.parse(fs.readFileSync('scripts/smmtoolbox_parsed.json', 'utf8'));
    console.log(`Loaded ${rawData.length} services to enrich...`);

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
    };

    console.log('Fetching login page to get CSRF token...');
    const loginRes = await fetch('https://panel.smmtoolbox.ru/admin/login', { headers });
    const loginHtml = await loginRes.text();
    const tokenMatch = loginHtml.match(/name="_token"\s+value="([^"]+)"/);
    if (!tokenMatch) throw new Error('CSRF Token not found');
    const token = tokenMatch[1];
    
    const rawCookies = loginRes.headers.get('set-cookie') || '';
    // Laravel needs smmtoolbox_session.
    let cookiesStr = rawCookies.split(',').map((c: string) => c.split(';')[0].trim()).join('; ');

    console.log('Logging in as a.sokolov@smm... token:', token);
    const formData = new URLSearchParams();
    formData.append('_token', token);
    formData.append('email', 'a.sokolov@smm');
    formData.append('password', 'Ud5pgC-4uK');

    const authRes = await fetch('https://panel.smmtoolbox.ru/admin/login', {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookiesStr,
            'Referer': 'https://panel.smmtoolbox.ru/admin/login',
            'Origin': 'https://panel.smmtoolbox.ru'
        },
        body: formData.toString()
    });

    const newCookies = authRes.headers.get('set-cookie');
    if (newCookies) {
        cookiesStr = newCookies.split(',').map((c: string) => c.split(';')[0].trim()).join('; ');
    }

    const authHtml = await authRes.text();
    if (authHtml.includes('name="email"') || authRes.status !== 200 && authRes.status !== 302) {
         console.warn('WARNING: Login failed. Status:', authRes.status);
         return; // Don't proceed.
    }
    console.log('Login successful. Session cookies:', cookiesStr);

    const detailedServices = [];
    const BATCH_SIZE = 10; 

    for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
        const batch = rawData.slice(i, i + BATCH_SIZE);
        
        const promises = batch.map(async (item: any) => {
            if (!item.editUrl) return item;
            try {
                const res = await fetch(item.editUrl, { headers: { ...headers, 'Cookie': cookiesStr } });
                const html = await res.text();
                
                let providerServiceText = '';
                // The new html has <select name="provider_service_id">
                // Find <option value="..." selected>1912 (32025) | Facebook members...</option>
                const selectBlockMatch = html.match(/<select[^>]*name="provider_service_id"[^>]*>([\s\S]*?)<\/select>/);
                if (selectBlockMatch) {
                    const block = selectBlockMatch[1];
                    const optMatch = block.match(/<option[^>]*selected[^>]*>([^<]+)<\/option>/);
                    if (optMatch) providerServiceText = optMatch[1].trim();
                } else {
                    // Try <input>
                    const iptMatch = html.match(/name="provider_service_id"[^>]*value="([^"]+)"/);
                    if (iptMatch) providerServiceText = iptMatch[1].trim();
                }

                let remoteServiceId = null;
                let remoteProviderId = null;
                
                if (providerServiceText) {
                    const match = providerServiceText.match(/^(\d+)[\s]*\(([\d]+)\)/);
                    if (match) {
                        remoteServiceId = match[1];
                        remoteProviderId = match[2];
                    } else if (providerServiceText.includes('(')) {
                         // fallback for weird formats
                         const m = providerServiceText.match(/\(([\d]+)\)/);
                         if (m) remoteProviderId = m[1];
                    }
                }

                return {
                    ...item,
                    remoteServiceId,
                    remoteProviderId,
                    rawProviderServiceText: providerServiceText
                };
            } catch (err: any) {
                return item;
            }
        });

        const results = await Promise.all(promises);
        detailedServices.push(...results);
        process.stdout.write(`Processed ${Math.min(i + BATCH_SIZE, rawData.length)} / ${rawData.length}\r`);
    }

    console.log(`\n✅ Scraped ${detailedServices.length} items.`);
    fs.writeFileSync('scripts/smmtoolbox_enriched.json', JSON.stringify(detailedServices, null, 2), 'utf8');
}

fastScrape().catch(e => { console.error(e); process.exit(1); });
