import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const services = await prisma.providerService.findMany({
        where: {
            platform: 'VK',
            category: { in: ['VIEWS', 'LIKES'] }
        },
        select: { id: true, name: true, category: true, rawData: true }
    });

    console.log('| ID | Name | Category | Info |');
    console.log('|---|---|---|---|');
    services.forEach(s => {
        const raw = s.rawData as any;
        console.log(`| ${s.id} | ${s.name} | ${s.category} | ${raw.desc || ''} |`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
