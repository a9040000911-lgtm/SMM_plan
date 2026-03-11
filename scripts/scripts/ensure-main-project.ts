import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- ENSURING MAIN PROJECT (101) ---');

    const project = await prisma.project.upsert({
        where: { slug: '101' },
        update: {},
        create: {
            name: 'Smmplan Main',
            slug: '101',
            domain: 'smmplan.ru',
            brandColor: '#3b82f6',
            config: {
                welcomeText: '👋 Добро пожаловать!',
                referralPercent: 10,
                minMargin: 15
            }
        }
    });

    console.log('✅ Main project ensured:', project.slug, project.id);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
