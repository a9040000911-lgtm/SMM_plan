import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- Provider Audit ---');
    const providers = await prisma.provider.findMany({
        include: {
            _count: {
                select: { services: true }
            }
        }
    });

    for (const p of providers) {
        console.log(`Provider: ${p.name} (ID: ${p.id}) - Services: ${p._count.services}`);
    }

    const totalServices = await prisma.providerService.count();
    console.log(`Total Provider Services: ${totalServices}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
