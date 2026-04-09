const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.internalService.findMany({ take: 5, select: { id: true, name: true, minQty: true, maxQty: true } });
    console.log("InternalServices (first 5):", services);
    
    // Check how many have minQty = 600
    const count600 = await prisma.internalService.count({ where: { minQty: 600 } });
    const total = await prisma.internalService.count();
    console.log(`InternalServices with minQty=600: ${count600} / ${total}`);
    
    const providerServices = await prisma.providerService.findMany({ take: 5, select: { id: true, name: true, rawData: true } });
    console.log("ProviderServices (first 5):", providerServices.map(ps => ({
        id: ps.id, 
        name: ps.name, 
        min: ps.rawData.min, 
        max: ps.rawData.max 
    })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
