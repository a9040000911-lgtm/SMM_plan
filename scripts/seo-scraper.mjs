import * as fs from 'fs';

async function fetchAndExtract(url) {
    console.log(`\n--- Inspecting ${url} ---`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        
        // 1. Title
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        console.log(`[Title]:`, titleMatch ? titleMatch[1].trim() : 'NOT FOUND');

        // 2. Meta Description
        const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || 
                          html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i);
        console.log(`[Meta Description]:`, descMatch ? descMatch[1].trim() : 'NOT FOUND');

        // 3. H1 Tags
        const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
        let h1Match;
        let count = 0;
        while ((h1Match = h1Regex.exec(html)) !== null) {
            count++;
            console.log(`[H1 #${count}]:`, h1Match[1].replace(/<[^>]+>/g, '').trim());
        }
        if (count === 0) console.log(`[H1]: NOT FOUND`);

        // 4. Schema org JSON-LD
        const schemaRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
        let schemaMatch;
        let scount = 0;
        while ((schemaMatch = schemaRegex.exec(html)) !== null) {
            scount++;
            try {
                const parsed = JSON.parse(schemaMatch[1]);
                console.log(`[Schema #${scount} Type]:`, parsed["@type"]);
                // console.log(`[Schema #${scount} JSON-LD]:`, JSON.stringify(parsed, null, 2).substring(0, 300) + '...');
            } catch (e) {
                console.log(`[Schema #${scount}]: INVALID JSON`);
            }
        }
        if (scount === 0) console.log(`[Schema]: NOT FOUND`);

    } catch (e) {
        console.log(`Error fetching ${url}:`, e.message);
    }
}

async function run() {
    await fetchAndExtract('http://localhost:3000/');
    await fetchAndExtract('http://localhost:3000/catalog');
    await fetchAndExtract('https://primelike.ru/');
}

run();
