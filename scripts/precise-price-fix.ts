import { PrismaClient } from '../src/generated/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function run() {
    const rawData = fs.readFileSync(path.join(__dirname, 'smmtoolbox_parsed.json'), 'utf-8');
    const items = JSON.parse(rawData);
    
    let updated = 0;
    
    for (const item of items) {
        // Original ID used as InternalService ID
        const internalId = String(item.id);
        
        // Find price column
        const rawCompPrice = item.allCols[9];
        if (!rawCompPrice) continue;
        
        const compPriceStr = rawCompPrice.toString().replace(/[^\d.,]/g, '').replace(',', '.');
        const compPrice = parseFloat(compPriceStr);
        
        if (isNaN(compPrice) || compPrice === 0) continue;
        
        // User explicitly wants 30% discount from the competitor's raw price
        const targetRetailPrice = compPrice * 0.70;
        
        try {
            const svc = await prisma.internalService.findUnique({ where: { id: internalId } });
            if (svc) {
                await prisma.internalService.update({
                    where: { id: internalId },
                    data: { pricePer1000: targetRetailPrice, marketPrice: compPrice }
                });
                updated++;
                console.log(`[${internalId}] Fixed price to ${targetRetailPrice} (from ${compPrice})`);
            }
        } catch(e) {
            console.error(`Error updating ${internalId}:`, e.message);
        }
    }
    
    console.log(`✅ Fixed prices for ${updated} services!`);
    await prisma.$disconnect();
}

run().catch(console.error);
