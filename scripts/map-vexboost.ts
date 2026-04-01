import * as fs from 'fs';

interface VexboostService {
    id: string; // Internal UUID
    externalId: string; // e.g. "5450"
    name: string;
    rawPriceOriginal: string;
    SocialPlatform?: { name: string } | null;
    ServiceCategory?: { name: string } | null;
}

interface SmmtoolboxRow {
    id: string;
    tier: string;
    platform: string;
    fullName: string;
    originalName: string;
    providerName: string;
    providerId: string;
    remoteId: string;
    remotePrice: string;
}

// Простая функция схожести строк (Левенштейн)
function levenshtein(a: string, b: string): number {
    a = a.toLowerCase(); b = b.toLowerCase();
    const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[a.length][b.length];
}

async function mapCatalog() {
    console.log('Загрузка данных...');
    
    // 1. Грузим Vexboost
    const vexJson = JSON.parse(fs.readFileSync('vexboost_full.json', 'utf8')) as VexboostService[];
    
    // 2. Грузим SMMToolbox CSV
    const csvLines = fs.readFileSync('smmtoolbox_DEEP_export.csv', 'utf8')
        .replace(/^\uFEFF/, '') // remove BOM
        .split('\n')
        .filter(l => l.trim().length > 0);
        
    const headers = csvLines.shift(); // skip header

    const referenceServices: SmmtoolboxRow[] = csvLines.map(line => {
        const cols = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
        // Колонки основываясь на scrape-deep.ts
        // База_1=ID, База_2=Tier, База_3=Platform, База_4=FullName, База_5=OriginalName... База_13=...
        // ... Provider_Name, SMMToolbox_ProviderID, Remote_Provider_Service_ID, Remote_Price
        return {
            id: cols[0],
            tier: cols[1],
            platform: cols[2],
            fullName: cols[3],
            originalName: cols[4],
            providerName: cols[cols.length - 4],
            providerId: cols[cols.length - 3],
            remoteId: cols[cols.length - 2],
            remotePrice: cols[cols.length - 1],
        };
    });

    console.log(`Загружено ${referenceServices.length} эталонных услуг и ${vexJson.length} услуг Vexboost.`);

    const results = [];

    // 3. Выполняем маппинг
    for (const ref of referenceServices) {
        let match1: any = null;
        let match2: any = null;
        let match3: any = null;
        let matchType = 'SEMANTIC';

        // ЭТАП 1: Прямое совпадение по Remote ID (Если SMMToolbox юзает Vexboost)
        if (ref.remoteId && ref.remoteId !== 'ERROR') {
            const exactMatch = vexJson.find(v => v.externalId === ref.remoteId);
            if (exactMatch) {
                match1 = exactMatch;
                matchType = 'DIRECT_100%';
            }
        }

        // ЭТАП 2: Семантический поиск, если прямого совпадения нет
        if (!match1) {
            // Фильтруем Vexboost по соцсети (очень грубо, чтобы отсеять лишнее)
            const platformKeyword = ref.platform.toLowerCase().substring(0, 4); 
            const candidates = vexJson.filter(v => 
                (v.SocialPlatform?.name?.toLowerCase().includes(platformKeyword)) ||
                (v.name.toLowerCase().includes(platformKeyword))
            );

            // Оцениваем каждого кандидата
            const scored = candidates.map(v => {
                let score = 0;
                
                // Штраф за разницу длины Левенштейна к "Внутреннему" имени СММТулбокса
                const dist = levenshtein(ref.originalName, v.name);
                score -= dist;

                // Бонус за совпадение ключевых слов (лайки, подписчики, просмотры, эконом)
                const keywords = ref.tier.toLowerCase().split(' ').concat(ref.fullName.toLowerCase().split(' '));
                for (const kw of keywords) {
                    if (kw.length > 3 && v.name.toLowerCase().includes(kw)) {
                        score += 50; 
                    }
                }

                // Бонус за похожую цену
                const refPrice = parseFloat(ref.remotePrice) || 0;
                const vexPrice = parseFloat(v.rawPriceOriginal) || 0;
                if (refPrice > 0 && vexPrice > 0) {
                    const priceDiff = Math.abs(refPrice - vexPrice);
                    if (priceDiff < 5) score += 30; // очень похожая цена закупки
                    else if (priceDiff < 20) score += 10;
                }

                return { service: v, score };
            });

            // Сортируем по очкам (чем больше, тем лучше)
            scored.sort((a, b) => b.score - a.score);

            if (scored.length > 0) match1 = scored[0].service;
            if (scored.length > 1) match2 = scored[1].service;
            if (scored.length > 2) match3 = scored[2].service;
        }

        results.push({
            Target_Smmplan_Tier: `[${ref.platform}] ${ref.fullName} (${ref.tier})`,
            Match_Type: matchType,
            Vexboost_Match_1_ID: match1 ? match1.externalId : '',
            Vexboost_Match_1_Name: match1 ? match1.name : 'NO MATCH',
            Vexboost_Match_1_Price: match1 ? match1.rawPriceOriginal : '',
            Vexboost_Match_2_ID: match2 ? match2.externalId : '',
            Vexboost_Match_3_ID: match3 ? match3.externalId : ''
        });
    }

    // Сохраняем результат
    const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
    const finalLines = results.map(r => [
        escapeCsv(r.Target_Smmplan_Tier),
        escapeCsv(r.Match_Type),
        escapeCsv(r.Vexboost_Match_1_ID),
        escapeCsv(r.Vexboost_Match_1_Name),
        escapeCsv(r.Vexboost_Match_1_Price),
        escapeCsv(r.Vexboost_Match_2_ID),
        escapeCsv(r.Vexboost_Match_3_ID)
    ].join(';'));

    const header = "Target_Smmplan_Tier;Match_Type;Vexboost_Match_1_ID;Vexboost_Match_1_Name;Vexboost_Match_1_Price;Vexboost_Match_2_ID;Vexboost_Match_3_ID";
    fs.writeFileSync('vexboost_interchangeable_map.csv', '\uFEFF' + header + '\n' + finalLines.join('\n'), 'utf8');

    console.log('ГОТОВО! Матрица взаимозаменяемости сохранена в vexboost_interchangeable_map.csv');
    console.log(`Полных 100% совпадений: ${results.filter(r => r.Match_Type === 'DIRECT_100%').length}`);
    console.log(`Семантических подборов: ${results.filter(r => r.Match_Type === 'SEMANTIC').length}`);
}

mapCatalog().catch(e => console.error(e));
