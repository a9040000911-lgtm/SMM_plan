import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const provider = await prisma.provider.findFirst({
        where: { name: { contains: 'socrocket', mode: 'insensitive' } }
    });
    console.log('--- SOCROCKET PROVIDER ---');
    console.log(JSON.stringify(provider, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
