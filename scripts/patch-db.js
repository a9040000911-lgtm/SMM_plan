require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const res = await prisma.$executeRawUnsafe(`UPDATE "InternalService" SET "targetType" = 'CHANNEL' WHERE "name" ILIKE '%boost%'`);
    console.log('Updated rows:', res);

    const check = await prisma.internalService.findMany({
        where: { name: { contains: 'boost', mode: 'insensitive' } },
        select: { name: true, targetType: true }
    });
    console.log('Verification:', check);
}
main().catch(console.error).finally(() => process.exit(0));
