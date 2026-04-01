const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Catalog Quality Tagging & Profit Optimization...");

    const services = await prisma.internalService.findMany({
        where: { isActive: true },
        include: {
            providerMappings: {
                include: { providerService: true }
            }
        }
    });

    const dropKeywords = ['без гарантии', 'no refill', 'списания', 'drop', 'not guaranteed', 'without guarantee', 'not refill'];
    const qualityKeywords = ['гарант', 'guarantee', 'refill', 'hq', 'real', 'живые', 'premium', 'high quality'];

    let orphansDeactivated = 0;
    let pricesUpdated = 0;
    
    let stats = {
        PREMIUM: 0,
        GUARANTEED: 0,
        NORMAL: 0,
        DROP: 0
    };

    for (const s of services) {
        // 1. Check Orphans
        if (s.providerMappings.length === 0) {
            await prisma.internalService.update({
                where: { id: s.id },
                data: { isActive: false }
            });
            orphansDeactivated++;
            continue;
        }

        // 2. Identify Quality
        const desc = (s.description || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        const fullText = name + ' ' + desc;

        let isDrop = dropKeywords.some(k => fullText.includes(k));
        let isHQ = qualityKeywords.some(k => fullText.includes(k));

        let quality = 'NORMAL';
        if (isDrop) quality = 'DROP';
        else if (isHQ) quality = 'GUARANTEED';
        else if (name.includes('premium')) quality = 'PREMIUM';

        stats[quality]++;

        // 3. Update Price based on user requested rules:
        // "Наценка должна быть минимум 500% для услуг, в среднем 1000% Дешевые услуги делаем с наценкой 5000%"
        
        let providerCost = 0;
        let pService = s.providerMappings[0]?.providerService;
        if (pService && pService.rawPrice) {
            providerCost = Number(pService.rawPrice);
        } else if (s.lastProviderPrice) {
            providerCost = Number(s.lastProviderPrice);
        }

        let multiplier = 11; // 1000% margin (x11 retail)

        if (providerCost < 1) {
            multiplier = 51; // 5000%
        } else if (providerCost > 150) {
            multiplier = 6; // minimum 500% 
        }

        let newPrice = providerCost * multiplier;
        // Gateway buffer
        newPrice = newPrice * 1.03;
        
        // Safety floor
        const safetyPrice = providerCost * 2 * 1.03;
        if (newPrice < safetyPrice) newPrice = safetyPrice;

        // Psychological rounding
        if (newPrice > 1000) {
            newPrice = Math.ceil(newPrice);
        } else {
            newPrice = Math.ceil(newPrice * 10) / 10;
        }

        // 4. Update Database Record
        const currentMeta = typeof s.metadata === 'object' && s.metadata !== null ? s.metadata : {};
        
        await prisma.internalService.update({
            where: { id: s.id },
            data: {
                metadata: { ...currentMeta, quality },
                pricePer1000: newPrice
            }
        });
        pricesUpdated++;
    }

    console.log(`✅ Deactivated ${orphansDeactivated} orphan services.`);
    console.log(`✅ Updated tags & prices for ${pricesUpdated} services.`);
    console.log(`📊 Quality Breakdown:`, stats);
}

main().finally(() => prisma.$disconnect());
