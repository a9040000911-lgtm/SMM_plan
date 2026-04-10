import fs from 'fs';
import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function run() {
    console.log('Calculating and applying -30% discount logic...');
    const data = JSON.parse(fs.readFileSync('./scripts/smmtoolbox_parsed.json', 'utf-8'));
    
    let updated = 0;
    
    for (const item of data) {
        if (!item.id || isNaN(parseInt(item.id))) continue;
        
        const originalId = item.id; // DB `id` matches originalId stringly
        const rawCompPrice = item.allCols[9];
        const compPrice = parseFloat(rawCompPrice.replace(/[^\d.,]/g, '').replace(',', '.'));
        
        if (isNaN(compPrice) || compPrice === 0) continue;

        // "сделать дешевле процентов на 30" -> -30% от розничной цены конкурента
        const targetRetailPrice = compPrice * 0.70;

        try {
            await prisma.internalService.update({
                where: { id: originalId },
                data: {
                    pricePer1000: targetRetailPrice
                }
            });
            updated++;
        } catch (e) {
            // Service not found or skipped (like the 11 from missing providers), which is normal
        }
    }
    
    console.log(`✅ Успешно обновлены цены (скидка 30% от прайса Smmtoolbox) для ${updated} активных услуг!`);
    await prisma.$disconnect();
    process.exit(0);
}

run().catch(console.error);
