import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const prisma = new PrismaClient();

function normalize(str: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-zа-яё0-9]/gi, ' ').replace(/\s+/g, ' ').trim();
}

function extractKeywords(str: string): string[] {
    const stops = new Set(['на', 'в', 'для', 'от', 'до', 'и', 'с', 'без', 'за', 'по', 'к', 'из', 'не', 'или', 'что', 'это', 'сервер']);
    return normalize(str).split(' ').filter(w => w.length > 2 && !stops.has(w));
}

async function generateComparisonTable() {
    console.log('Генерирую сводную таблицу для ручной проверки...\n');

    // Загружаем всё
    const vexProvider = await prisma.provider.findFirst({ where: { name: { contains: 'Vex', mode: 'insensitive' } } });
    if (!vexProvider) { console.error('Vexboost не найден'); process.exit(1); }

    const allServices = await prisma.internalService.findMany({ orderBy: { name: 'asc' } });
    const allMappings = await prisma.internalServiceMapping.findMany({
        where: { providerId: vexProvider.id },
        include: { ProviderService: true }
    });
    const mappingMap = new Map(allMappings.map(m => [m.internalServiceId, m]));

    const platforms = await prisma.socialPlatform.findMany();
    const platMap = new Map(platforms.map(p => [p.id, p]));

    const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
    const provMap = new Map(providers.map(p => [p.id, p]));

    const allProviderServices = await prisma.providerService.findMany({
        where: { providerId: { not: vexProvider.id } }
    });

    // Имена провайдеров для шапки (кроме Vexboost)
    const otherProviders = providers.filter(p => p.id !== vexProvider.id).sort((a, b) => a.name.localeCompare(b.name));

    // CSV шапка
    const header = [
        'Платформа',
        'Наша услуга (SMMPlan)',
        'SMMPlan Цена₽',
        'Vexboost ID',
        'Vexboost Название',
        'Vexboost Цена₽',
        'Vex Min',
        'Vex Max',
        ...otherProviders.flatMap(p => [
            `${p.name} ID`,
            `${p.name} Название`,
            `${p.name} Цена₽`,
            `${p.name} Min`,
            `${p.name} Max`,
            `${p.name} Score`,
        ])
    ].join('\t');

    const rows: string[] = [header];

    for (const svc of allServices) {
        const mapping = mappingMap.get(svc.id);
        if (!mapping?.ProviderService) continue;

        const vxPS = mapping.ProviderService;
        const vxRaw = (vxPS.rawData as any) || {};
        const platName = svc.socialPlatformId ? platMap.get(svc.socialPlatformId)?.name || '' : '';

        // Ищем лучшего кандидата для КАЖДОГО провайдера
        const keywords = extractKeywords(vxPS.name);

        const bestByProvider: Record<string, { extId: string; name: string; price: number; min: string; max: string; score: number }> = {};

        for (const c of allProviderServices) {
            const prov = provMap.get(c.providerId);
            if (!prov) continue;

            const cNorm = normalize(c.name);
            let score = 0;
            for (const kw of keywords) {
                if (cNorm.includes(kw)) score++;
            }
            if (score < 2) continue;

            const raw = (typeof c.rawData === 'string' ? JSON.parse(c.rawData) : c.rawData) as any || {};
            const cMin = String(raw.min ?? '');
            const cMax = String(raw.max ?? '');

            // Бонус за совпадение лимитов
            if (cMin === String(vxRaw.min) && cMax === String(vxRaw.max)) score += 3;

            let rubPrice = Number(c.rawPrice);
            const meta = prov.metadata as any;
            if (meta?.currency === 'USD') rubPrice *= 95;

            const existing = bestByProvider[prov.id];
            if (!existing || score > existing.score || (score === existing.score && rubPrice < existing.price)) {
                bestByProvider[prov.id] = { extId: c.externalId, name: c.name, price: rubPrice, min: cMin, max: cMax, score };
            }
        }

        // Формируем строку
        const cells = [
            platName,
            svc.name,
            String(Number(svc.pricePer1000)),
            vxPS.externalId,
            vxPS.name,
            String(Number(vxPS.rawPrice)),
            String(vxRaw.min ?? ''),
            String(vxRaw.max ?? ''),
        ];

        for (const prov of otherProviders) {
            const best = bestByProvider[prov.id];
            if (best) {
                cells.push(best.extId, best.name, best.price.toFixed(2), best.min, best.max, String(best.score));
            } else {
                cells.push('', '', '', '', '', '');
            }
        }

        rows.push(cells.join('\t'));
    }

    const output = rows.join('\n');
    const outPath = 'd:\\Smmplan\\scripts\\provider_comparison_table.tsv';
    fs.writeFileSync(outPath, '\ufeff' + output, 'utf8'); // BOM для корректного открытия в Excel
    console.log(`✅ Таблица сохранена: ${outPath}`);
    console.log(`   Строк: ${rows.length - 1} услуг × ${otherProviders.length} провайдеров`);
    console.log(`\n💡 Откройте файл в Excel или Google Sheets (Tab-separated). Каждая строка — одна наша услуга.`);
    console.log(`   Для каждого провайдера показан лучший кандидат (по score семантического совпадения).`);
}

generateComparisonTable().catch(console.error).finally(() => prisma.$disconnect());
