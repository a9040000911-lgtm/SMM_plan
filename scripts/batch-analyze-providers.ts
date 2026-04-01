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

type ServiceAnalysis = {
    internalId: string;
    internalName: string;
    platform: string;
    category: string;
    smmplanPrice: number;
    vexId: string;
    vexName: string;
    vexPrice: number;
    vexMin: string;
    vexMax: string;
    candidates: CandidateMatch[];
    cheapestProvider: string;
    cheapestPrice: number;
    cheapestDiff: string;
    clonesFound: number;
    potentialSavings: number; // % экономии если переключить с Vex на самого дешёвого
};

type CandidateMatch = {
    providerName: string;
    extId: string;
    name: string;
    rubPrice: number;
    min: string;
    max: string;
    score: number;
    isClone: boolean;
    diff: string;
    diffPct: number;
};

async function batchAnalyze() {
    console.log('🚀 ПАКЕТНЫЙ АНАЛИЗ ВСЕХ 253 УСЛУГ — Поиск перекупов и первоисточников\n');
    console.log('='.repeat(80));

    // 1. Загружаем все InternalService с маппингами Vexboost
    const allServices = await prisma.internalService.findMany({
        orderBy: { name: 'asc' }
    });

    // 2. Загружаем все маппинги Vexboost за один запрос
    const vexProvider = await prisma.provider.findFirst({
        where: { name: { contains: 'Vex', mode: 'insensitive' } }
    });

    if (!vexProvider) {
        console.error('❌ Провайдер Vexboost не найден!');
        process.exit(1);
    }

    const allMappings = await prisma.internalServiceMapping.findMany({
        where: { providerId: vexProvider.id },
        include: { ProviderService: true }
    });
    const mappingMap = new Map(allMappings.map(m => [m.internalServiceId, m]));

    // 3. Загружаем платформы и категории
    const platforms = await prisma.socialPlatform.findMany();
    const platMap = new Map(platforms.map(p => [p.id, p]));
    const categories = await prisma.serviceCategory.findMany();
    const catMap = new Map(categories.map(c => [c.id, c]));

    // 4. Загружаем ВСЕ провайдерские услуги КРОМЕ Vexboost (один запрос)
    const allProviderServices = await prisma.providerService.findMany({
        where: { providerId: { not: vexProvider.id } }
    });

    // 5. Загружаем провайдеров
    const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
    const provMap = new Map(providers.map(p => [p.id, p]));

    // Группируем провайдерские услуги по providerId для быстрого доступа
    console.log(`📦 Загружено: ${allServices.length} внутренних услуг, ${allProviderServices.length} провайдерских услуг\n`);

    // 6. Обходим все услуги
    const results: ServiceAnalysis[] = [];
    let processed = 0;
    let skippedNoMapping = 0;

    for (const svc of allServices) {
        processed++;
        const mapping = mappingMap.get(svc.id);

        if (!mapping?.ProviderService) {
            skippedNoMapping++;
            continue;
        }

        const vxPS = mapping.ProviderService;
        const vxRaw = (vxPS.rawData as any) || {};
        const vxPrice = Number(vxPS.rawPrice);
        const vxMin = String(vxRaw.min ?? 'N/A');
        const vxMax = String(vxRaw.max ?? 'N/A');

        const platName = svc.socialPlatformId ? platMap.get(svc.socialPlatformId)?.name || 'N/A' : 'N/A';
        const catName = svc.categoryId ? catMap.get(svc.categoryId)?.name || 'N/A' : 'N/A';

        // Извлекаем ключевые слова из имени Vexboost-услуги
        const keywords = extractKeywords(vxPS.name);

        // Ищем кандидатов среди всех провайдерских услуг
        const candidates: CandidateMatch[] = [];

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
            const cMin = String(raw.min ?? 'N/A');
            const cMax = String(raw.max ?? 'N/A');

            const isClone = (cMin === vxMin && cMax === vxMax);
            if (isClone) score += 3;

            let rubPrice = Number(c.rawPrice);
            const meta = prov.metadata as any;
            if (meta?.currency === 'USD') rubPrice *= 95;

            const diffPct = vxPrice > 0 ? ((rubPrice - vxPrice) / vxPrice) * 100 : 0;
            const diffStr = diffPct > 0 ? `+${diffPct.toFixed(0)}%` : diffPct < 0 ? `${diffPct.toFixed(0)}%` : '0%';

            candidates.push({
                providerName: prov.name,
                extId: c.externalId,
                name: c.name,
                rubPrice,
                min: cMin,
                max: cMax,
                score,
                isClone,
                diff: diffStr,
                diffPct
            });
        }

        // Сортировка: по скору, потом по цене
        candidates.sort((a, b) => b.score !== a.score ? b.score - a.score : a.rubPrice - b.rubPrice);

        const cheapest = candidates.length > 0 ? [...candidates].sort((a, b) => a.rubPrice - b.rubPrice)[0] : null;
        const savings = cheapest && vxPrice > 0 ? ((vxPrice - cheapest.rubPrice) / vxPrice) * 100 : 0;

        results.push({
            internalId: svc.id,
            internalName: svc.name,
            platform: platName,
            category: catName,
            smmplanPrice: Number(svc.pricePer1000),
            vexId: vxPS.externalId,
            vexName: vxPS.name,
            vexPrice: vxPrice,
            vexMin: vxMin,
            vexMax: vxMax,
            candidates: candidates.slice(0, 5), // Топ 5 кандидатов
            cheapestProvider: cheapest?.providerName || 'N/A',
            cheapestPrice: cheapest?.rubPrice || 0,
            cheapestDiff: cheapest?.diff || 'N/A',
            clonesFound: candidates.filter(c => c.isClone).length,
            potentialSavings: savings
        });

        if (processed % 50 === 0) {
            console.log(`⏳ Обработано ${processed}/${allServices.length}...`);
        }
    }

    console.log(`\n✅ Обработано ${processed} услуг. Пропущено (нет маппинга Vex): ${skippedNoMapping}\n`);

    // ==============================
    // ГЕНЕРАЦИЯ ОТЧЁТА
    // ==============================

    // ЧАСТЬ 1: Сводная таблица
    console.log('='.repeat(140));
    console.log('📊 СВОДНАЯ ТАБЛИЦА: Все услуги vs Все провайдеры');
    console.log('─'.repeat(140));
    console.log(
        'Платформа'.padEnd(14) + '| ' +
        'Услуга'.padEnd(35) + '| ' +
        'Vex₽'.padEnd(10) + '| ' +
        'Дешевл.Провайдер'.padEnd(20) + '| ' +
        'Его₽'.padEnd(10) + '| ' +
        '±Vex'.padEnd(8) + '| ' +
        'Клоны'.padEnd(6) + '| ' +
        'Экономия'
    );
    console.log('─'.repeat(140));

    // Сортируем по потенциальной экономии (самые выгодные переключения сверху)
    const sorted = [...results].sort((a, b) => b.potentialSavings - a.potentialSavings);

    for (const r of sorted) {
        const savingsStr = r.potentialSavings > 0 ? `${r.potentialSavings.toFixed(0)}%` : '-';
        console.log(
            r.platform.substring(0, 13).padEnd(14) + '| ' +
            r.internalName.substring(0, 34).padEnd(35) + '| ' +
            r.vexPrice.toFixed(1).padEnd(10) + '| ' +
            r.cheapestProvider.substring(0, 19).padEnd(20) + '| ' +
            r.cheapestPrice.toFixed(1).padEnd(10) + '| ' +
            r.cheapestDiff.padStart(7) + ' | ' +
            String(r.clonesFound).padEnd(6) + '| ' +
            savingsStr
        );
    }
    console.log('='.repeat(140));

    // ЧАСТЬ 2: Статистика по провайдерам
    console.log('\n📈 СТАТИСТИКА ПО ПРОВАЙДЕРАМ (как часто каждый оказывается дешевле Vexboost):');
    const providerStats: Record<string, { wins: number; totalSavings: number; cloneCount: number }> = {};

    for (const r of results) {
        if (r.cheapestProvider !== 'N/A' && r.potentialSavings > 0) {
            if (!providerStats[r.cheapestProvider]) {
                providerStats[r.cheapestProvider] = { wins: 0, totalSavings: 0, cloneCount: 0 };
            }
            providerStats[r.cheapestProvider].wins++;
            providerStats[r.cheapestProvider].totalSavings += r.potentialSavings;
        }
        for (const cand of r.candidates) {
            if (cand.isClone) {
                if (!providerStats[cand.providerName]) {
                    providerStats[cand.providerName] = { wins: 0, totalSavings: 0, cloneCount: 0 };
                }
                providerStats[cand.providerName].cloneCount++;
            }
        }
    }

    console.log('─'.repeat(80));
    console.log('Провайдер'.padEnd(20) + '| ' + 'Дешевле Vex (раз)'.padEnd(20) + '| ' + 'Ср. экономия'.padEnd(15) + '| Клоны лимитов');
    console.log('─'.repeat(80));

    const statEntries = Object.entries(providerStats).sort((a, b) => b[1].wins - a[1].wins);
    for (const [name, stat] of statEntries) {
        const avgSavings = stat.wins > 0 ? stat.totalSavings / stat.wins : 0;
        console.log(
            name.padEnd(20) + '| ' +
            String(stat.wins).padEnd(20) + '| ' +
            `${avgSavings.toFixed(0)}%`.padEnd(15) + '| ' +
            String(stat.cloneCount)
        );
    }
    console.log('─'.repeat(80));

    // ЧАСТЬ 3: Услуги без альтернатив
    const noAlternatives = results.filter(r => r.candidates.length === 0);
    console.log(`\n🔒 УНИКАЛЬНЫЕ УСЛУГИ (нет альтернатив у других провайдеров): ${noAlternatives.length}`);
    for (const r of noAlternatives) {
        console.log(`   [${r.platform}] ${r.internalName} — Vex ID ${r.vexId}`);
    }

    // ЧАСТЬ 4: ТОП перекупов (одинаковые лимиты, наценка >10%)
    const resellers = results
        .flatMap(r => r.candidates.filter(c => c.isClone && c.diffPct > 10)
            .map(c => ({ service: r.internalName, platform: r.platform, ...c })))
        .sort((a, b) => b.diffPct - a.diffPct);

    console.log(`\n⚠️  ТОП ПОДОЗРИТЕЛЬНЫХ ПЕРЕКУПОВ (клоны лимитов + наценка >10%): ${resellers.length}`);
    for (const r of resellers.slice(0, 20)) {
        console.log(`   [${r.platform}] ${r.service} → ${r.providerName} ID ${r.extId}: ${r.rubPrice.toFixed(2)}₽ (${r.diff})`);
    }

    // Сохраняем результат в JSON для дальнейшей работы
    fs.writeFileSync('scripts/provider_analysis_results.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('\n💾 Полный результат сохранён в scripts/provider_analysis_results.json');
}

batchAnalyze().catch(console.error).finally(() => prisma.$disconnect());
