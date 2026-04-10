const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'tester_final@audit.com';

    console.log('--- User Info ---');
    const user = await prisma.user.findFirst({
        where: { email },
        select: {
            id: true,
            email: true,
            balance: true,
            username: true
        }
    });
    console.log(JSON.stringify(user, null, 2));

    if (user) {
        console.log('\n--- Recent Transactions ---');
        const transactions = await prisma.transaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log(JSON.stringify(transactions, null, 2));
    }

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
