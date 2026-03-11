import fs from 'fs';

async function extractTG() {
    const path = 'd:/Smmplan/tmp/vexboost_services_utf8.json';
    const content = fs.readFileSync(path, 'utf8');
    const cleanContent = content.trim().replace(/^\uFEFF/, '');
    const json = JSON.parse(cleanContent);
    const services = json.value || [];

    const tgServices = services.filter((s: any) =>
        s.network && (s.network === 'Telegram' || s.network === 'Telegram Premium') ||
        (s.category && s.category.toLowerCase().includes('telegram')) ||
        (s.name && s.name.toLowerCase().includes('telegram'))
    );

    const categories = Array.from(new Set(tgServices.map((s: any) => s.category)));

    const analysis = tgServices.map((s: any) => ({
        id: s.service,
        name: s.name,
        category: s.category,
        description: s.description ? s.description.substring(0, 100) : null
    }));

    fs.writeFileSync('d:/Smmplan/tmp/vexboost_tg_analysis.json', JSON.stringify({
        total: tgServices.length,
        categories,
        services: analysis
    }, null, 2), 'utf8');

    console.log(`Extracted ${tgServices.length} Telegram services into tmp/vexboost_tg_analysis.json`);
}

extractTG().catch(console.error);
