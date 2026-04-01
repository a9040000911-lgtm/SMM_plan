import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching Telegram categories...");
    const cats = await prisma.serviceCategory.findMany({
        where: { platform: 'TELEGRAM' }
    });
    console.log(cats.map(c => ({ id: c.id, name: c.name, type: c.categoryType })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
