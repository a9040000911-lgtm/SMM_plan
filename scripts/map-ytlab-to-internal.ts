import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Нормализация для поиска ключевых слов
function normalize(str: string): string[] {
    if (!str) return [];
    return str.toLowerCase()
        .replace(/[^a-z0-9]/gi, ' ')
        .split(' ')
        .filter(w => w.length > 3);
}

async function generateYTLabMapping() {
    console.log('⏳ Получение каталога TheYTLab...');
    
    // Получаем услуги YTLab
    const ytLabKey = 'e82fd7e2b37c6c113d3c4fe3e83030f5';
    const form = new URLSearchParams();
    form.append('key', ytLabKey);
    form.append('action', 'services');

    const res = await fetch('https://dashboard.theytlab.com/api/v2', { method: 'POST', body: form });
    const data = await res.json();
    const ytServices = Array.isArray(data) ? data : Object.values<any>(data);
    
    // Переводим цены YTLab в рубли (курс 95)
    ytServices.forEach(s => {
        s.rubPrice = Number(s.rate) * 95;
    });

    console.log('📦 Услуг YTLab получено:', ytServices.length);

    // Получаем внутренние услуги из нашей БД и фильтруем в памяти
    console.log('⏳ Поиск внутренних YouTube-услуг Smmplan...');
    const allInternalServices = await prisma.internalService.findMany();

    const internalServices = allInternalServices.filter(s => 
        (s.name && s.name.toLowerCase().includes('youtube')) || 
        (s.description && s.description.toLowerCase().includes('youtube'))
    );

    console.log(`Найдено ${internalServices.length} внутренних услуг YouTube.`);

    const mappingResults: any[] = [];

    // Для каждой внутренней услуги ищем лучший аналог в YTLab
    for (const internal of internalServices) {
        const iWords = normalize(internal.name);
        
        let bestMatch: any = null;
        let highestScore = 0;

        for (const yt of ytServices) {
            const ytWords = normalize(yt.name);
            
            // Считаем пересечение ключевых слов
            const commonWords = iWords.filter(w => ytWords.includes(w));
            let score = commonWords.length;

            // Штрафуем если у YTLab услуга "Bot" а у нас "Premium", и т.д.
            // Но пока просто берём самое близкое семантическое совпадение
            
            if (score > highestScore) {
                highestScore = score;
                bestMatch = yt;
            }
        }

        // Если нашли совпадение хотя бы по 1-2 словам
        if (bestMatch && highestScore >= 1) {
            // Текущая базовая цена
            const currentMarkup = Number(internal.pricePer1000);
            const savings = (currentMarkup - bestMatch.rubPrice) / currentMarkup * 100;

            mappingResults.push({
                InternalID: internal.id,
                InternalName: internal.name,
                OurPriceRub: currentMarkup.toFixed(2),
                YTLabID: bestMatch.service,
                YTLabName: bestMatch.name,
                YTLabPriceRub: bestMatch.rubPrice.toFixed(2),
                Score: highestScore,
                SavingsPercent: savings.toFixed(0) + '%'
            });
        }
    }

    // Записываем в TSV для Экселя
    const outputLines = ['Внутренний ID\tЧто продаем мы\tНаша базовая цена (₽)\tYTLab ID\tНазвание услуги YTLab\tОптовая цена YTLab (₽)\tСовпадение\tПотенциал выгоды'];
    
    for (const row of mappingResults) {
        outputLines.push(`${row.InternalID}\t${row.InternalName}\t${row.OurPriceRub}\t${row.YTLabID}\t${row.YTLabName}\t${row.YTLabPriceRub}\t${row.Score}\t${row.SavingsPercent}`);
    }

    fs.writeFileSync('scripts/ytlab_mapping.tsv', outputLines.join('\n'), 'utf8');
    
    console.log(`\n✅ Готово! Файл 'scripts/ytlab_mapping.tsv' создан.`);
    console.log(`Найдено кросс-матчей: ${mappingResults.length} из ${internalServices.length} наших услуг YouTube.`);
}

generateYTLabMapping().finally(() => prisma.$disconnect());
