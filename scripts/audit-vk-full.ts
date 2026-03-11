import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const services = await prisma.providerService.findMany({
        where: { platform: 'VK' },
        select: { id: true, name: true, category: true, targetType: true } as any
    });

    console.log('| ID | Название | Категория (Category) | Тип ссылки (TargetType) |');
    console.log('|---|---|---|---|');
    services.forEach(s => {
        console.log(`| ${s.id} | ${s.name} | ${s.category} | ${s.targetType} |`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
