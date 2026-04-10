import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function run() {
    const svcs = await prisma.internalService.findMany({ 
        where: { isActive: true }, 
        include: { providerMappings: { include: { providerService: true } } } 
    });
    
    let deactivated = 0;
    
    for (const s of svcs) {
        if (!s.providerMappings.length) continue;
        
        const costRub = Number(s.providerMappings[0].providerService.rawPrice);
        const retail = Number(s.pricePer1000);
        
        if (retail < costRub) {
            await prisma.internalService.update({
                where: { id: s.id },
                data: { isActive: false }
            });
            deactivated++;
            console.log(`Deactivated ${s.id}: Retail ${retail} ₽ < Cost ${costRub} ₽`);
        }
    }
    
    console.log(`\n✅ Critical protection triggered: ${deactivated} loss-making services safely disabled.`);
    process.exit(0);
}

run().catch(console.error);
