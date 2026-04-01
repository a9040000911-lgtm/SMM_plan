import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

function normalize(str: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-zа-яё0-9]/gi, ' ').replace(/\s+/g, ' ').trim();
}

async function deepResellAnalysis() {
    console.log('🔬 ГЛУБОКИЙ АНАЛИЗ ПЕРЕКУПОВ — Поиск скрытых паттернов\n');

    // Загружаем провайдеров
    const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
    const provMap = new Map(providers.map(p => [p.id, p]));

    // Загружаем ВСЕ провайдерские услуги
    const allPS = await prisma.providerService.findMany();
    console.log(`📦 Загружено ${allPS.length} провайдерских услуг от ${providers.length} провайдеров\n`);

    // Группируем по провайдеру
    const byProvider: Record<string, typeof allPS> = {};
    for (const ps of allPS) {
        if (!byProvider[ps.providerId]) byProvider[ps.providerId] = [];
        byProvider[ps.providerId].push(ps);
    }

    // =====================================================
    // ТЕСТ 1: Поиск ТОЧНЫХ ДУБЛИКАТОВ rawData-структуры
    // Если два провайдера имеют услугу с одинаковыми min, max, type, refill, cancel — это клон
    // =====================================================
    console.log('═'.repeat(100));
    console.log('🧪 ТЕСТ 1: Совпадение структуры rawData между провайдерами');
    console.log('─'.repeat(100));

    type Fingerprint = {
        min: string;
        max: string;
        type: string;
        refill: string;
        cancel: string;
        nameNorm: string; // нормализованное имя без эмодзи
    };

    // Строим "отпечатки" для каждой услуги
    const fingerprints: Map<string, { providerId: string; providerName: string; extId: string; name: string; price: number }[]> = new Map();

    for (const ps of allPS) {
        const raw = (typeof ps.rawData === 'string' ? JSON.parse(ps.rawData) : ps.rawData) as any || {};
        const fp: Fingerprint = {
            min: String(raw.min ?? ''),
            max: String(raw.max ?? ''),
            type: String(raw.type ?? ''),
            refill: String(raw.refill ?? raw.Refill ?? ''),
            cancel: String(raw.cancel ?? raw.Cancel ?? ''),
            nameNorm: normalize(ps.name).replace(/\d+/g, 'N') // заменяем числа на N для обобщения
        };

        // Ключ — конкатенация отпечатка
        const key = `${fp.min}|${fp.max}|${fp.type}|${fp.refill}|${fp.cancel}|${fp.nameNorm}`;

        if (!fingerprints.has(key)) fingerprints.set(key, []);
        const prov = provMap.get(ps.providerId);
        fingerprints.get(key)!.push({
            providerId: ps.providerId,
            providerName: prov?.name || 'Unknown',
            extId: ps.externalId,
            name: ps.name,
            price: Number(ps.rawPrice)
        });
    }

    // Находим отпечатки, которые встречаются у 2+ провайдеров
    let exactClones = 0;
    const clonePairs: { fp: string; entries: typeof fingerprints extends Map<string, infer V> ? V : never }[] = [];

    for (const [fp, entries] of fingerprints) {
        const uniqueProviders = new Set(entries.map(e => e.providerId));
        if (uniqueProviders.size >= 2) {
            exactClones++;
            clonePairs.push({ fp, entries });
        }
    }

    console.log(`\n🎯 Найдено ${exactClones} услуг с ПОЛНЫМИ клонами (min+max+type+refill+cancel+name совпадают у 2+ провайдеров)\n`);

    // Показываем топ-20 самых интересных
    clonePairs.sort((a, b) => b.entries.length - a.entries.length);
    let shown = 0;
    for (const cp of clonePairs.slice(0, 15)) {
        const sorted = cp.entries.sort((a, b) => a.price - b.price);
        const cheapest = sorted[0];
        const mostExpensive = sorted[sorted.length - 1];
        const markup = cheapest.price > 0 ? ((mostExpensive.price - cheapest.price) / cheapest.price * 100).toFixed(0) : '∞';

        console.log(`  📋 "${sorted[0].name.substring(0, 60)}"`);
        for (const e of sorted) {
            const marker = e === cheapest ? '💰' : e === mostExpensive ? '💸' : '  ';
            console.log(`     ${marker} ${e.providerName.padEnd(18)} ID ${e.extId.padEnd(7)} ${e.price.toFixed(2).padEnd(12)}₽`);
        }
        console.log(`     ↳ Наценка перекупа: ${markup}%`);
        console.log('');
        shown++;
    }

    // =====================================================
    // ТЕСТ 2: Постоянный коэффициент наценки между парами провайдеров
    // =====================================================
    console.log('═'.repeat(100));
    console.log('🧪 ТЕСТ 2: Системная наценка — постоянный коэффициент между парами провайдеров');
    console.log('─'.repeat(100));

    // Для каждой пары провайдеров считаем соотношение цен на клонированные услуги
    const pairRatios: Record<string, number[]> = {};

    for (const cp of clonePairs) {
        const sorted = cp.entries.sort((a, b) => a.price - b.price);
        // Сравниваем каждую пару
        for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
                if (sorted[i].price <= 0) continue;
                const key = `${sorted[i].providerName} → ${sorted[j].providerName}`;
                const ratio = sorted[j].price / sorted[i].price;
                if (!pairRatios[key]) pairRatios[key] = [];
                pairRatios[key].push(ratio);
            }
        }
    }

    // Для каждой пары считаем среднее, медиану и стабильность
    console.log(`\n${'Пара провайдеров'.padEnd(45)} | Клонов | Ср.наценка | Медиана | Стабильн. | Вердикт`);
    console.log('─'.repeat(120));

    const pairStats = Object.entries(pairRatios)
        .filter(([_, ratios]) => ratios.length >= 3) // минимум 3 совпадения
        .map(([pair, ratios]) => {
            ratios.sort((a, b) => a - b);
            const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
            const median = ratios[Math.floor(ratios.length / 2)];
            // Коэффициент вариации (стабильность)
            const stddev = Math.sqrt(ratios.reduce((s, r) => s + (r - avg) ** 2, 0) / ratios.length);
            const cv = avg > 0 ? (stddev / avg) * 100 : 0;
            return { pair, count: ratios.length, avg, median, cv };
        })
        .sort((a, b) => a.cv - b.cv); // Самые стабильные наценки сверху

    for (const s of pairStats) {
        const verdict = s.cv < 15 ? '🔴 ПЕРЕКУП (стабильная наценка)' :
                       s.cv < 40 ? '🟡 Возможен перекуп' :
                       '🟢 Разные источники';
        console.log(
            `${s.pair.padEnd(45)} | ${String(s.count).padEnd(6)} | x${s.avg.toFixed(2).padEnd(9)} | x${s.median.toFixed(2).padEnd(6)} | CV=${s.cv.toFixed(0).padEnd(4)}% | ${verdict}`
        );
    }

    // =====================================================
    // ТЕСТ 3: Копипаст описаний
    // =====================================================
    console.log('\n' + '═'.repeat(100));
    console.log('🧪 ТЕСТ 3: Копипаст описаний (description)');
    console.log('─'.repeat(100));

    // Группируем по нормализованному описанию
    const descMap: Map<string, { providerName: string; name: string; extId: string }[]> = new Map();
    for (const ps of allPS) {
        const raw = (typeof ps.rawData === 'string' ? JSON.parse(ps.rawData) : ps.rawData) as any || {};
        const desc = normalize(String(raw.description ?? ps.description ?? ''));
        if (desc.length < 20) continue; // пропускаем пустые/короткие

        if (!descMap.has(desc)) descMap.set(desc, []);
        const prov = provMap.get(ps.providerId);
        descMap.get(desc)!.push({
            providerName: prov?.name || 'Unknown',
            name: ps.name,
            extId: ps.externalId
        });
    }

    let copiedDescs = 0;
    for (const [desc, entries] of descMap) {
        const uniqueProvs = new Set(entries.map(e => e.providerName));
        if (uniqueProvs.size >= 2) {
            copiedDescs++;
            if (copiedDescs <= 10) {
                console.log(`\n  📝 Описание (${desc.length} символов): "${desc.substring(0, 80)}..."`);
                for (const e of entries.slice(0, 5)) {
                    console.log(`     → ${e.providerName.padEnd(18)} "${e.name.substring(0, 50)}" (ID ${e.extId})`);
                }
                if (entries.length > 5) console.log(`     ... и ещё ${entries.length - 5}`);
            }
        }
    }
    console.log(`\n📊 Итого: ${copiedDescs} описаний скопированы между 2+ провайдерами\n`);

    // =====================================================
    // ИТОГОВЫЙ ВЕРДИКТ
    // =====================================================
    console.log('═'.repeat(100));
    console.log('🏛️ ИТОГОВЫЙ ВЕРДИКТ ПО КАЖДОМУ ПРОВАЙДЕРУ');
    console.log('─'.repeat(100));

    for (const prov of providers) {
        const services = byProvider[prov.id] || [];
        
        // Сколько раз этот провайдер оказывается самым дешевым в клоне
        let cheapestCount = 0;
        let expensiveCount = 0;
        for (const cp of clonePairs) {
            const myEntries = cp.entries.filter(e => e.providerId === prov.id);
            if (myEntries.length === 0) continue;
            const sorted = cp.entries.sort((a, b) => a.price - b.price);
            if (sorted[0].providerId === prov.id) cheapestCount++;
            else expensiveCount++;
        }

        const role = cheapestCount > expensiveCount * 2 ? '🟢 ПЕРВОИСТОЧНИК' :
                    expensiveCount > cheapestCount * 2 ? '🔴 ПЕРЕКУП' :
                    '🟡 СМЕШАННЫЙ';

        console.log(`${role} ${prov.name.padEnd(20)} | ${services.length} услуг | Дешевле всех: ${cheapestCount} | Дороже: ${expensiveCount}`);
    }
    console.log('═'.repeat(100));
}

deepResellAnalysis().catch(console.error).finally(() => prisma.$disconnect());
