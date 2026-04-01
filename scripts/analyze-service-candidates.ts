import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Нормализация текста для семантического сравнения
function normalize(str: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-zа-яё0-9]/gi, ' ').replace(/\s+/g, ' ').trim();
}

// Извлечение ключевых слов из строки
function extractKeywords(str: string): string[] {
    const stops = new Set(['на', 'в', 'для', 'от', 'до', 'и', 'с', 'без', 'за', 'по', 'к', 'из', 'не', 'или', 'что', 'это']);
    return normalize(str)
        .split(' ')
        .filter(w => w.length > 2 && !stops.has(w));
}

async function analyzeService() {
    // ==============================
    // 1. ПОИСК ЭТАЛОННОЙ УСЛУГИ
    // ==============================
    const searchString = process.argv[2] || "Просмотры";

    console.log(`🔍 Поиск эталонной услуги по запросу: "${searchString}"...\n`);

    const targetService = await prisma.internalService.findFirst({
        where: { name: { contains: searchString, mode: 'insensitive' } }
    });

    if (!targetService) {
        console.error("❌ Услуга не найдена. Укажите часть названия как аргумент CLI.");
        // Показываем список для подсказки
        const all = await prisma.internalService.findMany({ take: 20, select: { name: true } });
        console.log("Примеры услуг:", all.map(s => s.name).join(', '));
        process.exit(1);
    }

    // ==============================
    // 2. ПОЛУЧАЕМ МАППИНГ VEXBOOST (источник для сравнения)
    // ==============================
    const refMapping = await prisma.internalServiceMapping.findFirst({
        where: {
            internalServiceId: targetService.id,
            Provider: { name: { contains: 'Vex', mode: 'insensitive' } }
        },
        include: { Provider: true, ProviderService: true }
    });

    const platform = targetService.socialPlatformId
        ? await prisma.socialPlatform.findUnique({ where: { id: targetService.socialPlatformId } })
        : null;
    const category = targetService.categoryId
        ? await prisma.serviceCategory.findUnique({ where: { id: targetService.categoryId } })
        : null;

    if (!refMapping?.ProviderService) {
        console.error("❌ Нет маппинга Vexboost для этой услуги. Невозможно провести сравнение.");
        process.exit(1);
    }

    const vxService = refMapping.ProviderService;
    const vxRaw = (vxService.rawData as any) || {};
    const vxName = vxService.name;
    const vxPrice = Number(vxService.rawPrice);
    const vxMin = vxRaw.min;
    const vxMax = vxRaw.max;
    const vxExtId = vxService.externalId;

    console.log(`✅ Наша услуга: ${targetService.name}`);
    console.log(`   Платформа: ${platform?.name || 'N/A'} | Категория: ${category?.name || 'N/A'}`);
    console.log(`   SMMPlan Цена: ${targetService.pricePer1000}₽ | Лимиты: ${targetService.minQty}-${targetService.maxQty}`);
    console.log(`\n📦 Исходник у Vexboost:`);
    console.log(`   ID: ${vxExtId} | Цена: ${vxPrice}₽ | Лимиты: ${vxMin}-${vxMax}`);
    console.log(`   Название: "${vxName}"\n`);

    // ==============================
    // 3. ИЩЕМ АНАЛОГИ У ДРУГИХ ПРОВАЙДЕРОВ
    //    Ключевая идея: ищем по ключевым словам оригинала Vexboost
    // ==============================
    const keywords = extractKeywords(vxName);
    console.log(`🔑 Ключевые слова для поиска: [${keywords.join(', ')}]`);

    const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
    const provMap = new Map(providers.map(p => [p.id, p]));

    // Загружаем ВСЕ провайдерские услуги (кроме Vexboost) и фильтруем по платформе
    const platformName = platform?.name || '';
    const allCandidates = await prisma.providerService.findMany({
        where: {
            providerId: { not: refMapping.providerId }, // Исключаем Vexboost
            ...(platformName ? { name: { contains: platformName, mode: 'insensitive' as const } } : {})
        }
    });

    console.log(`📊 Найдено ${allCandidates.length} услуг от других провайдеров (фильтр: ${platformName || 'все'}).\n`);

    // ==============================
    // 4. СКОРИНГ КАЖДОГО КАНДИДАТА
    // ==============================
    type Match = {
        providerName: string;
        extId: string;
        name: string;
        rubPrice: number;
        min: string;
        max: string;
        score: number;
        isClone: boolean;
        diff: string; // % разница с Vexboost
    };

    const matches: Match[] = [];

    for (const c of allCandidates) {
        const prov = provMap.get(c.providerId);
        if (!prov) continue;

        const cNorm = normalize(c.name);
        let score = 0;

        // Считаем совпадения ключевых слов
        for (const kw of keywords) {
            if (cNorm.includes(kw)) score++;
        }

        // Минимум 2 совпавших слова чтобы считать кандидатом
        if (score < 2) continue;

        // Парсинг rawData
        const raw = (typeof c.rawData === 'string' ? JSON.parse(c.rawData) : c.rawData) as any || {};
        const cMin = String(raw.min ?? 'N/A');
        const cMax = String(raw.max ?? 'N/A');

        // Бонус за совпадение лимитов (признак клонирования)
        const isClone = (cMin === String(vxMin) && cMax === String(vxMax));
        if (isClone) score += 3;

        // Цена в рублях
        let rubPrice = Number(c.rawPrice);
        const meta = prov.metadata as any;
        if (meta?.currency === 'USD') rubPrice *= 95;

        // Разница в цене относительно Vexboost
        const diffPct = vxPrice > 0 ? ((rubPrice - vxPrice) / vxPrice) * 100 : 0;
        const diffStr = diffPct > 0 ? `+${diffPct.toFixed(0)}%` : diffPct < 0 ? `${diffPct.toFixed(0)}%` : '0%';

        matches.push({
            providerName: prov.name,
            extId: c.externalId,
            name: c.name,
            rubPrice,
            min: cMin,
            max: cMax,
            score,
            isClone,
            diff: diffStr
        });
    }

    // ==============================
    // 5. ВЫВОД РЕЗУЛЬТАТОВ
    // ==============================
    matches.sort((a, b) => b.score !== a.score ? b.score - a.score : a.rubPrice - b.rubPrice);
    const top = matches.slice(0, 20);

    console.log(`\n${'='.repeat(130)}`);
    console.log(`📊 СРАВНИТЕЛЬНАЯ ТАБЛИЦА: ${targetService.name} [${platform?.name || ''}]`);
    console.log(`${'─'.repeat(130)}`);
    console.log(`REF (Vexboost): ID ${vxExtId} | ${vxPrice.toFixed(2)}₽ | min=${vxMin} max=${vxMax} | ${vxName}`);
    console.log(`${'─'.repeat(130)}`);
    console.log(`${'Провайдер'.padEnd(18)}| ${'ID'.padEnd(7)}| ${'Цена ₽'.padEnd(12)}| ${'±Vex'.padEnd(8)}| ${'Min'.padEnd(8)}| ${'Max'.padEnd(10)}| ${'Score'.padEnd(6)}| Название`);
    console.log(`${'─'.repeat(130)}`);

    for (const m of top) {
        const clone = m.isClone ? '♻️' : '  ';
        console.log(
            `${clone}${m.providerName.padEnd(16)}| ` +
            `${m.extId.padEnd(7)}| ` +
            `${m.rubPrice.toFixed(2).padEnd(12)}| ` +
            `${m.diff.padStart(7)} | ` +
            `${m.min.padEnd(8)}| ` +
            `${m.max.padEnd(10)}| ` +
            `${String(m.score).padEnd(6)}| ` +
            `${m.name.substring(0, 50)}`
        );
    }
    console.log(`${'='.repeat(130)}`);

    // Отдельно выводим выявленных перекупов
    const clones = matches.filter(m => m.isClone);
    if (clones.length > 0) {
        console.log(`\n⚠️  ОБНАРУЖЕНЫ ВОЗМОЖНЫЕ ПЕРЕКУПЫ (совпадение лимитов min/max с Vexboost):`);
        for (const cl of clones) {
            console.log(`   ${cl.providerName} ID ${cl.extId}: ${cl.rubPrice.toFixed(2)}₽ (${cl.diff} vs Vexboost) — "${cl.name.substring(0, 60)}"`);
        }
    }

    // Самый дешевый кандидат
    if (matches.length > 0) {
        const cheapest = [...matches].sort((a, b) => a.rubPrice - b.rubPrice)[0];
        console.log(`\n💰 Самый дешевый кандидат: ${cheapest.providerName} ID ${cheapest.extId} — ${cheapest.rubPrice.toFixed(2)}₽ (${cheapest.diff} vs Vex)`);
    } else {
        console.log(`\n⚠️  Совпадений не найдено. Услуга уникальна для Vexboost или нужно расширить поиск.`);
    }

    console.log(`\n✅ Анализ завершен. Найдено ${matches.length} кандидатов (показано ${top.length}).`);
}

analyzeService().catch(console.error).finally(() => prisma.$disconnect());
