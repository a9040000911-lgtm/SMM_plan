import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const services = await prisma.providerService.findMany({
        where: { platform: 'VK' },
        select: { id: true, name: true, category: true }
    });

    console.log('| ID | Name | Category |');
    console.log('|---|---|---|');
    services.forEach(s => {
        console.log(`| ${s.id} | ${s.name} | ${s.category} |`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
