import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

function normalize(str: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-zа-яё0-9]/gi, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Скрипт мгновенной Big Data верификации нового провайдера (Первоисточник или Перекуп)
 * Использование: npx tsx scripts/verify-new-provider.ts "URL" "API_KEY" "CURRENCY(RUB/USD)"
 */
async function verifyCandidate() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.error('❌ Ошибка: Укажите URL, API KEY и Валюту (RUB или USD)');
        console.log('💡 Пример: npx tsx scripts/verify-new-provider.ts "https://justanotherpanel.com/api/v2" "your_key" "USD"');
        process.exit(1);
    }

    const [apiUrl, apiKey, currency] = args;
    const isUsd = currency.toUpperCase() === 'USD';
    const rate = isUsd ? 95 : 1; // Заглушка, можно брать из CBR

    console.log(`\n🔍 Запуск расследования кандидата: ${apiUrl}`);
    console.log(`🔑 Ключ: ${apiKey.substring(0, 5)}... | Валюта: ${isUsd ? 'USD (x95)' : 'RUB'}\n`);

    try {
        // 1. Делаем запрос к API
        console.log('⏳ Скачивание каталога (API v2)...');
        const fetch = (await import('node-fetch')).default;
        
        // Поддержка GET и POST методов API
        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('action', 'services');

        let data: any;
        try {
            const res = await fetch(apiUrl, { method: 'POST', body: formData });
            data = await res.json();
        } catch (e) {
            // Фолбэк на GET если POST не сработал
            const res = await fetch(`${apiUrl}?key=${apiKey}&action=services`);
            data = await res.json();
        }

        if (!data || data.error) {
            console.error('❌ Ошибка API:', data?.error || 'Неверный ответ');
            process.exit(1);
        }

        const candidateServices: any[] = Array.isArray(data) ? data : Object.values(data);
        console.log(`📦 Успех! Выкачано ${candidateServices.length} услуг кандидата.`);

        // 2. Загружаем эталонного Первоисточника (Stream Promotion) для сравнения
        const referenceProvider = await prisma.provider.findFirst({
            where: { name: { contains: 'Stream', mode: 'insensitive' } }
        });

        if (!referenceProvider) {
             console.error('❌ Нет эталона Stream Promotion в БД');
             process.exit(1);
        }

        const refServices = await prisma.providerService.findMany({
            where: { providerId: referenceProvider.id }
        });

        // Строим карту эталона по отпечатку: min|max
        const refMap = new Map<string, {name: string, price: number}[]>();
        for (const rs of refServices) {
            const raw = (typeof rs.rawData === 'string' ? JSON.parse(rs.rawData) : rs.rawData) as any;
            const fp = `${raw.min}|${raw.max}`;
            if (!refMap.has(fp)) refMap.set(fp, []);
            refMap.get(fp)!.push({ name: rs.name, price: Number(rs.rawPrice) });
        }

        // 3. Столкновение лбами (Big Data Анализ)
        console.log(`\n🧬 Анализ клонов лимитов против эталона (${referenceProvider.name})...`);
        
        const ratios: number[] = [];
        let cheaperCount = 0;
        let expensiveCount = 0;
        let cloneHits = 0;

        for (const cs of candidateServices) {
            const fp = `${cs.min}|${cs.max}`;
            const cPrice = Number(cs.rate) * rate;

            // Если у эталона есть такие же лимиты
            if (refMap.has(fp)) {
                const targets = refMap.get(fp)!;
                // Ищем семантическое совпадение
                const cWords = normalize(cs.name).split(' ').filter(w => w.length > 3);
                
                for (const t of targets) {
                    const tWords = normalize(t.name).split(' ').filter(w => w.length > 3);
                    const common = cWords.filter(w => tWords.includes(w));
                    
                    if (common.length >= 2) {
                        // Точное бинго! Одна и та же услуга.
                        cloneHits++;
                        const ratio = cPrice / t.price; 
                        ratios.push(ratio);

                        if (ratio < 1.0) cheaperCount++;
                        else if (ratio > 1.0) expensiveCount++;
                        
                        break; // Идём к следующей услуге кандидата
                    }
                }
            }
        }

        console.log('─'.repeat(80));
        console.log(`🎯 Найдено прямых математических пересечений (клонов): ${cloneHits}`);
        
        if (cloneHits < 10) {
            console.log('🟡 Слишком мало общих услуг с эталоном. Возможно это первоисточник другой ниши (например, только Instagram).');
            return;
        }

        ratios.sort((a, b) => a - b);
        const medianRatio = ratios[Math.floor(ratios.length / 2)];
        
        // Считаем CV%
        const avg = ratios.reduce((a,b) => a+b, 0) / ratios.length;
        const stddev = Math.sqrt(ratios.reduce((s, r) => s + (r - avg) ** 2, 0) / ratios.length);
        const cv = (stddev / avg) * 100;

        console.log(`\n📊 РЕЗУЛЬТАТЫ БИТВЫ (Кандидат vs ${referenceProvider.name}):`);
        console.log(`   - Кандидат дешевле эталона:   ${cheaperCount} раз`);
        console.log(`   - Кандидат дороже эталона:    ${expensiveCount} раз`);
        console.log(`   - Медианный множитель цены:   x${medianRatio.toFixed(2)}`);
        console.log(`   - Стабильность наценки (CV):  ${cv.toFixed(1)}%`);
        console.log('\n🏛️ ВЕРДИКТ ИИ:');
        
        if (cv < 30 && medianRatio > 1.1) {
            console.log(`   🔴 ПЕРЕКУП. У них жесткая наценка +${((medianRatio-1)*100).toFixed(0)}% с низким разбросом (CV=${cv.toFixed(0)}%). Они 100% закупают у эталона.`);
        } else if (cheaperCount > expensiveCount * 2) {
            console.log(`   🟢 ПЕРВОИСТОЧНИК! Этот кандидат громит эталон по ценам. Мы нашли золотую оптовую жилу.`);
        } else {
            console.log(`   🟡 СМЕШАННЫЙ РЕСЕЛЛЕР. Перепродажа из разных источников.`);
        }
        console.log('─'.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Фатальная ошибка проверки:', error);
    }
}

verifyCandidate().finally(() => prisma.$disconnect());
