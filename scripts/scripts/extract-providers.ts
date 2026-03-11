import fs from 'fs';

interface ServiceEntry {
    comp_id: string;
    platform: string;
    category: string;
    name: string;
    provider: string;
    markup: string;
    price: string;
}

async function extractProviders() {
    const rawData = fs.readFileSync('toolbox_services_site1_full.json', 'utf8');
    const services = JSON.parse(rawData);

    const results: ServiceEntry[] = [];
    const providersSet = new Set<string>();

    for (const s of services) {
        const cols = s.allCols;
        if (!cols || cols.length < 11) continue;

        // В site1_full.json провайдер часто идет в названии услуги или 5-й колонке (index 4)
        // Структура cols:
        // 0: ID
        // 1: Name
        // 2: Platform
        // 3: Category
        // 4: Full Name with Provider (e.g. "Name | likedrom")

        const fullName = cols[4] || "";
        const providerMatch = fullName.split('|').pop()?.trim() || "unknown";

        results.push({
            comp_id: s.id,
            platform: s.category, // В этом JSON category - это платформа
            category: s.providerInfo,
            name: s.name,
            provider: providerMatch,
            markup: cols[8],
            price: cols[9]
        });

        providersSet.add(providerMatch);
    }

    // Сортировка по провайдеру для удобства анализа
    results.sort((a, b) => a.provider.localeCompare(b.provider));

    // Создаем MD таблицу
    let md = "# Реестр провайдеров и услуг Smmtoolbox\n\n";
    md += `Обнаружено провайдеров: **${providersSet.size}**\n`;
    md += `Всего услуг: **${results.length}**\n\n`;
    md += "| ID | Платформа | Категория | Услуга | Провайдер | Наценка | Цена |\n";
    md += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n";

    for (const r of results) {
        md += `| ${r.comp_id} | ${r.platform} | ${r.category} | ${r.name} | **${r.provider}** | ${r.markup} | ${r.price} |\n`;
    }

    fs.writeFileSync('scripts/provider_analysis.md', md);
    console.log('--- АНАЛИЗ ЗАВЕРШЕН ---');
    console.log(`Провайдеры: ${Array.from(providersSet).join(', ')}`);
    console.log('Результат сохранен в scripts/provider_analysis.md');
}

extractProviders();
