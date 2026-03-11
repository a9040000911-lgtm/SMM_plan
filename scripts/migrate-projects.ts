import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting migration to projects...');

    // 1. Create Default Project
    const defaultProject = await prisma.project.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
            name: 'Smmplan Pro',
            slug: 'default',
            domain: 'smmplan.ru',
            botToken: process.env.TELEGRAM_BOT_TOKEN || 'MISSING_TOKEN',
            botUsername: process.env.BOT_USERNAME || 'smmplan_bot',
            config: {
                welcomeText: '👋 Добро пожаловать!',
                referralPercent: 10,
                minMargin: 15
            }
        }
    });

    console.log(`✅ Default project created: ${defaultProject.id}`);

    // 2. Migrate Users
    const usersUpdate = await prisma.user.updateMany({
        where: { projectId: null },
        data: { projectId: defaultProject.id }
    });
    console.log(`✅ Migrated ${usersUpdate.count} users`);

    // 3. Migrate Orders
    const ordersUpdate = await prisma.order.updateMany({
        where: { projectId: null },
        data: { projectId: defaultProject.id }
    });
    console.log(`✅ Migrated ${ordersUpdate.count} orders`);

    // 4. Migrate Tickets
    const ticketsUpdate = await prisma.supportTicket.updateMany({
        where: { projectId: null },
        data: { projectId: defaultProject.id }
    });
    console.log(`✅ Migrated ${ticketsUpdate.count} tickets`);

    // 5. Migrate Transactions
    const transactionsUpdate = await prisma.transaction.updateMany({
        where: { projectId: null },
        data: { projectId: defaultProject.id }
    });
    console.log(`✅ Migrated ${transactionsUpdate.count} transactions`);

    // 6. Migrate PromoCodes
    const promosUpdate = await prisma.promoCode.updateMany({
        where: { projectId: null },
        data: { projectId: defaultProject.id }
    });
    console.log(`✅ Migrated ${promosUpdate.count} promo codes`);

    // 7. Migrate News
    const newsUpdate = await prisma.news.updateMany({
        where: { projectId: null },
        data: { projectId: defaultProject.id }
    });
    console.log(`✅ Migrated ${newsUpdate.count} news entries`);

    console.log('🏁 Migration finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
