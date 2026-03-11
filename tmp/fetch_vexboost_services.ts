import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const provider = await prisma.provider.findFirst({
        where: { name: { contains: 'vexboost', mode: 'insensitive' } }
    });

    if (!provider) {
        console.log('Provider "vexboost" not found.');
        return;
    }

    const services = await prisma.providerService.findMany({
        where: { providerId: provider.id },
        select: { id: true, name: true, category: true }
    });

    console.log(JSON.stringify({ providerId: provider.id, count: services.length, services }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
