import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function markupAnalysis() {
    console.log('🔬 АНАЛИЗ НАЦЕНКИ: Поиск постоянного коэффициента между парами провайдеров\n');

    const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
    const provMap = new Map(providers.map(p => [p.id, p]));
    const provNames = new Map(providers.map(p => [p.id, p.name]));

    const allPS = await prisma.providerService.findMany();
    console.log(`📦 Загружено ${allPS.length} услуг\n`);

    // Строим отпечаток ТОЛЬКО по min+max (без имени!)
    type Entry = { providerId: string; providerName: string; extId: string; name: string; price: number };
    const byFingerprint: Map<string, Entry[]> = new Map();

    for (const ps of allPS) {
        const raw = (typeof ps.rawData === 'string' ? JSON.parse(ps.rawData) : ps.rawData) as any || {};
        const min = String(raw.min ?? '');
        const max = String(raw.max ?? '');
        if (!min || !max || min === '' || max === '') continue;

        const fp = `${min}|${max}`;
        if (!byFingerprint.has(fp)) byFingerprint.set(fp, []);
        byFingerprint.get(fp)!.push({
            providerId: ps.providerId,
            providerName: provNames.get(ps.providerId) || 'Unknown',
            extId: ps.externalId,
            name: ps.name,
            price: Number(ps.rawPrice)
        });
    }

    // Находим пары по min+max — объединяем ТОЛЬКО если есть семантическое пересечение
    // (одинаковые лимиты + хотя бы одно общее ключевое слово в названии)
    console.log('═'.repeat(110));
    console.log('📊 ЧАСТЬ 1: Ценовые пары (min+max совпадают + общие ключевые слова)');
    console.log('─'.repeat(110));

    // Для каждой пары провайдеров собираем ВСЕ ценовые соотношения
    type PairData = { ratios: number[]; examples: { name1: string; price1: number; id1: string; name2: string; price2: number; id2: string }[] };
    const pairMarkup: Map<string, PairData> = new Map();

    for (const [fp, entries] of byFingerprint) {
        if (entries.length < 2) continue;

        // Группируем по провайдеру
        const byProv: Map<string, Entry[]> = new Map();
        for (const e of entries) {
            if (!byProv.has(e.providerId)) byProv.set(e.providerId, []);
            byProv.get(e.providerId)!.push(e);
        }

        const provIds = [...byProv.keys()];
        if (provIds.length < 2) continue;

        // Сравниваем каждую пару провайдеров
        for (let i = 0; i < provIds.length; i++) {
            for (let j = i + 1; j < provIds.length; j++) {
                const servicesA = byProv.get(provIds[i])!;
                const servicesB = byProv.get(provIds[j])!;

                // Смотрим на каждую комбинацию услуг с одинаковыми лимитами
                for (const a of servicesA) {
                    for (const b of servicesB) {
                        if (a.price <= 0 || b.price <= 0) continue;

                        // Семантическая проверка: хотя бы 2 общих слова длиной >3
                        const wordsA = a.name.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
                        const wordsB = b.name.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
                        const common = wordsA.filter(w => wordsB.includes(w));
                        if (common.length < 2) continue;

                        // Всегда делаем дешёвый → дорогой
                        let cheapProv: string, expProv: string;
                        let cheapEntry: Entry, expEntry: Entry;
                        if (a.price <= b.price) {
                            cheapProv = a.providerName; expProv = b.providerName;
                            cheapEntry = a; expEntry = b;
                        } else {
                            cheapProv = b.providerName; expProv = a.providerName;
                            cheapEntry = b; expEntry = a;
                        }

                        const key = `${cheapProv} → ${expProv}`;
                        const ratio = expEntry.price / cheapEntry.price;

                        if (!pairMarkup.has(key)) pairMarkup.set(key, { ratios: [], examples: [] });
                        const pd = pairMarkup.get(key)!;
                        pd.ratios.push(ratio);
                        if (pd.examples.length < 5) {
                            pd.examples.push({
                                name1: cheapEntry.name, price1: cheapEntry.price, id1: cheapEntry.extId,
                                name2: expEntry.name, price2: expEntry.price, id2: expEntry.extId
                            });
                        }
                    }
                }
            }
        }
    }

    // Выводим результаты по парам
    const pairResults = [...pairMarkup.entries()]
        .filter(([_, d]) => d.ratios.length >= 3)
        .map(([pair, d]) => {
            d.ratios.sort((a, b) => a - b);
            const avg = d.ratios.reduce((s, r) => s + r, 0) / d.ratios.length;
            const median = d.ratios[Math.floor(d.ratios.length / 2)];
            const stddev = Math.sqrt(d.ratios.reduce((s, r) => s + (r - avg) ** 2, 0) / d.ratios.length);
            const cv = avg > 0 ? (stddev / avg) * 100 : 999;
            // Процент наценки
            const markupPct = (median - 1) * 100;
            return { pair, count: d.ratios.length, avg, median, cv, markupPct, examples: d.examples };
        })
        .sort((a, b) => a.cv - b.cv); // Стабильные наценки сверху

    console.log(`\n${'Направление наценки (дешёвый→дорогой)'.padEnd(46)}| ${'Пар'.padEnd(5)}| ${'Ср.множитель'.padEnd(13)}| ${'Медиана'.padEnd(9)}| ${'CV%'.padEnd(6)}| ${'Наценка'.padEnd(9)}| Вердикт`);
    console.log('─'.repeat(110));

    for (const r of pairResults) {
        const verdict = r.cv < 20 ? '🔴 ПЕРЕКУП (стабильная наценка!)' :
                       r.cv < 50 ? '🟡 Вероятный перекуп' :
                       '🟢 Разные источники';
        console.log(
            `${r.pair.padEnd(46)}| ${String(r.count).padEnd(5)}| x${r.avg.toFixed(2).padEnd(12)}| x${r.median.toFixed(2).padEnd(8)}| ${r.cv.toFixed(0).padEnd(5)} | +${r.markupPct.toFixed(0).padEnd(7)}% | ${verdict}`
        );
    }

    // Для каждой подозрительной пары показываем примеры
    console.log('\n' + '═'.repeat(110));
    console.log('🔍 ПРИМЕРЫ ДЛЯ РУЧНОЙ ПРОВЕРКИ (топ 5 пар с самой стабильной наценкой)');
    console.log('─'.repeat(110));

    for (const r of pairResults.filter(r => r.cv < 50).slice(0, 5)) {
        console.log(`\n📌 ${r.pair} (медиана x${r.median.toFixed(2)}, CV=${r.cv.toFixed(0)}%, ${r.count} пар)`);
        for (const ex of r.examples) {
            console.log(`   💰 ${ex.price1.toFixed(2).padEnd(10)}₽ ID ${ex.id1.padEnd(7)} "${ex.name1.substring(0, 50)}"`);
            console.log(`   💸 ${ex.price2.toFixed(2).padEnd(10)}₽ ID ${ex.id2.padEnd(7)} "${ex.name2.substring(0, 50)}"`);
            console.log(`   ↳ Коэфф: x${(ex.price2 / ex.price1).toFixed(2)}`);
            console.log('');
        }
    }

    // ЧАСТЬ 2: Кто у кого закупает? Граф зависимостей
    console.log('═'.repeat(110));
    console.log('🕸️ ГРАФ ПЕРЕКУПОВ: Кто у кого закупает (по стабильности наценки)');
    console.log('─'.repeat(110));

    // Считаем для каждого провайдера: сколько раз дешевле / дороже
    const providerRole: Record<string, { source: number; reseller: number }> = {};

    for (const r of pairResults) {
        const [source, reseller] = r.pair.split(' → ');
        if (!providerRole[source]) providerRole[source] = { source: 0, reseller: 0 };
        if (!providerRole[reseller]) providerRole[reseller] = { source: 0, reseller: 0 };
        providerRole[source].source += r.count;
        providerRole[reseller].reseller += r.count;
    }

    console.log(`${'Провайдер'.padEnd(20)}| ${'Первоисточник (раз)'.padEnd(22)}| ${'Перекуп (раз)'.padEnd(16)}| Роль`);
    console.log('─'.repeat(80));
    for (const [name, role] of Object.entries(providerRole).sort((a, b) => b[1].source - a[1].source)) {
        const label = role.source > role.reseller * 3 ? '🟢 ПЕРВОИСТОЧНИК' :
                     role.reseller > role.source * 3 ? '🔴 ПЕРЕКУП' :
                     '🟡 СМЕШАННЫЙ';
        console.log(`${name.padEnd(20)}| ${String(role.source).padEnd(22)}| ${String(role.reseller).padEnd(16)}| ${label}`);
    }
    console.log('─'.repeat(80));
}

markupAnalysis().catch(console.error).finally(() => prisma.$disconnect());
