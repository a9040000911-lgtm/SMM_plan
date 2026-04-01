import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const DATA_PATH = path.join(__dirname, 'turbo_markups_raw.json');

async function main() {
    console.log('🚀 Перерасчет цен: Наценка в 2 раза ниже конкурента (Smmtoolbox)...');

    const data: string[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    
    // Create a map by ID
    const toolboxPrices = new Map<string, number>();
    
    for (const row of data) {
        const parts = row.split(' | ');
        if (parts.length < 11) continue;

        const id = parts[0].trim();
        if (!id || isNaN(parseInt(id))) continue;

        const markupStr = parts[9]?.trim().replace(/\s/g, '').replace('%', ''); // "600"
        const finalPriceStr = parts[10]?.trim().replace('₽', '').replace(',', '.').replace(/\s/g, ''); // "1074"
        
        const markupPercent = parseFloat(markupStr) || 0;
        const compPrice = parseFloat(finalPriceStr) || 0;

        if (compPrice <= 0 || markupPercent <= 0) {
            // If no markup info, just cut price by 25% safely
            toolboxPrices.set(id, compPrice * 0.75);
            continue;
        }

        // Math: compPrice = cost * (1 + markupPercent/100)
        // newPrice = cost * (1 + (markupPercent/100) / 2)
        const cost = compPrice / (1 + markupPercent / 100);
        const targetMarkupPercent = markupPercent / 2;
        const newPrice = cost * (1 + targetMarkupPercent / 100);

        toolboxPrices.set(id, newPrice);
    }

    const services = await prisma.internalService.findMany();
    let updated = 0;

    for (const s of services) {
        if (!toolboxPrices.has(s.id)) continue;
        const newPrice = toolboxPrices.get(s.id)!;
        
        await prisma.internalService.update({
            where: { id: s.id },
            data: { pricePer1000: newPrice }
        });
        updated++;
    }

    console.log(`✅ Итог: Обновлено ${updated} услуг. Наценка снижена ровно в 2 раза от цены конкурента.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
