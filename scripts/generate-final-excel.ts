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

// "Белый список" доказанных первоисточников (на основе нашего анализа)
const PRIMARY_SOURCES = ['Stream Promotion', 'Telegram.shop'];

async function generateFinalExcel() {
    console.log('📊 Генерация финальной таблицы "Перекуп vs Первоисточник"...\n');

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

    const header = [
        'Платформа',
        'Наша услуга (Smmplan)',
        'Наша цена ₽',
        
        '-- РЕСЕЛЛЕР (Текущий) --',
        'Текущий провайдер',
        'ID Реселлера',
        'Название у реселлера',
        'Цена реселлера ₽',
        'Min',
        'Max',

        '-- ВЕРДИКТ: ПЕРВОИСТОЧНИК --',
        'Найденный Оптовик',
        'ID Оптовика',
        'Название у оптовика',
        'Цена оптовика ₽',
        'Min',
        'Max',
        
        '-- АНАЛИТИКА --',
        'Наценка перекупа',
        'Экономия %',
        'Точность совпадения'
    ].join('\t');

    const rows: string[] = [header];

    for (const svc of allServices) {
        const mapping = mappingMap.get(svc.id);
        if (!mapping?.ProviderService) continue;

        const vxPS = mapping.ProviderService;
        const vxRaw = (vxPS.rawData as any) || {};
        const vexMin = String(vxRaw.min ?? '');
        const vexMax = String(vxRaw.max ?? '');
        const vexPrice = Number(vxPS.rawPrice);
        
        const platName = svc.socialPlatformId ? platMap.get(svc.socialPlatformId)?.name || 'N/A' : 'N/A';
        const keywords = extractKeywords(vxPS.name);

        let bestCandidate = null;
        let highestScore = -1;

        for (const c of allProviderServices) {
            const prov = provMap.get(c.providerId);
            if (!prov) continue;

            const cNorm = normalize(c.name);
            let score = 0;
            for (const kw of keywords) {
                if (cNorm.includes(kw)) score++;
            }
            if (score < 2) continue; // Отбрасываем нерелевантные

            const raw = (typeof c.rawData === 'string' ? JSON.parse(c.rawData) : c.rawData) as any || {};
            const cMin = String(raw.min ?? '');
            const cMax = String(raw.max ?? '');

            let isExactClone = false;
            if (cMin === vexMin && cMax === vexMax) {
                score += 10; // Огромный вес за точное совпадение лимитов
                isExactClone = true;
            }

            // Бонус, если это доказанный первоисточник (Stream Promotion)
            if (PRIMARY_SOURCES.includes(prov.name)) {
                score += 5;
            }

            let rubPrice = Number(c.rawPrice);
            const meta = prov.metadata as any;
            if (meta?.currency === 'USD') rubPrice *= 95;

            // Штраф, если он дороже перекупа
            if (rubPrice >= vexPrice) score -= 20;

            if (score > highestScore || (score === highestScore && bestCandidate && rubPrice < bestCandidate.price)) {
                highestScore = score;
                bestCandidate = { 
                    providerName: prov.name,
                    extId: c.externalId, 
                    name: c.name, 
                    price: rubPrice, 
                    min: cMin, 
                    max: cMax, 
                    isClone: isExactClone,
                    isPrimary: PRIMARY_SOURCES.includes(prov.name)
                };
            }
        }

        const cells = [
            platName,
            svc.name,
            String(Number(svc.pricePer1000)),
            
            '---|---',
            'Vexboost (Реселлер)',
            vxPS.externalId,
            vxPS.name,
            vexPrice.toFixed(2),
            vexMin,
            vexMax,

            '---|---'
        ];

        if (bestCandidate) {
            const markup = bestCandidate.price > 0 ? ((vexPrice / bestCandidate.price) - 1) * 100 : 0;
            const savings = vexPrice > 0 ? ((vexPrice - bestCandidate.price) / vexPrice) * 100 : 0;
            
            let confidenceStr = '';
            if (bestCandidate.isClone && bestCandidate.isPrimary) confidenceStr = '🟢 100% Клон у Первоисточника';
            else if (bestCandidate.isClone) confidenceStr = '🟡 90% Точный клон (Возможно тоже перекуп)';
            else if (bestCandidate.isPrimary) confidenceStr = '🟡 80% Дешевый аналог оптовика';
            else confidenceStr = '🟠 50% Семантический аналог';

            cells.push(
                bestCandidate.providerName + (bestCandidate.isPrimary ? ' ⭐' : ''),
                bestCandidate.extId,
                bestCandidate.name,
                bestCandidate.price.toFixed(4),
                bestCandidate.min,
                bestCandidate.max,
                
                '---|---',
                `+${markup.toFixed(0)}%`, // Наценка
                `-${savings.toFixed(0)}%`, // Экономия
                confidenceStr
            );
        } else {
            cells.push('❌ Не найдено', '', '', '', '', '', '---|---', '', '', 'Уникальная услуга');
        }

        rows.push(cells.join('\t'));
    }

    const output = rows.join('\n');
    const outPath = 'd:\\Smmplan\\scripts\\final_provider_verdict.tsv';
    fs.writeFileSync(outPath, '\ufeff' + output, 'utf8');
    console.log(`✅ Создан финальный прайс-лист для ручной проверки: ${outPath}`);
    console.log(`👉 Откройте файл final_provider_verdict.tsv в Excel (разделитель табуляция)`);
}

generateFinalExcel().catch(console.error).finally(() => prisma.$disconnect());
