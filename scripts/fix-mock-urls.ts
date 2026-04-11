import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixApiUrl() {
    console.log("Fixing API URLs for MOCK providers...");
    const providers = await prisma.provider.findMany({ where: { name: { startsWith: '[MOCK]' } } });
    
    for (const p of providers) {
        const metadata = p.metadata as any || {};
        const alias = metadata.alias || p.name.replace('[MOCK] ', '').trim();
        const correctUrl = `https://smmplan.pro/api/mock-provider?alias=${alias}`;
        
        await prisma.provider.update({
            where: { id: p.id },
            data: { apiUrl: correctUrl }
        });
        console.log(`Updated ${alias} -> ${correctUrl}`);
    }
    console.log("Done");
}

fixApiUrl().catch(e => console.error(e)).finally(() => prisma.$disconnect());
