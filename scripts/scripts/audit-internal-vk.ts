import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const services = await prisma.internalService.findMany({
        where: {
            OR: [
                { platform: 'VK' },
                { name: { contains: 'VK', mode: 'insensitive' } },
                { name: { contains: 'ВК', mode: 'insensitive' } }
            ]
        },
        select: { id: true, name: true, platform: true, targetType: true, category: true }
    });

    console.log('| ID | Name | Platform | Category | TargetType |');
    console.log('|---|---|---|---|---|');
    services.forEach(s => {
        console.log(`| ${s.id} | ${s.name} | ${s.platform} | ${s.category} | ${s.targetType} |`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
