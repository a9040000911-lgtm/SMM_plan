import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const svcs = await prisma.internalService.findMany({
        where: { platform: 'VK' },
        select: { id: true, name: true, category: true, targetType: true }
    });
    console.log(JSON.stringify(svcs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
