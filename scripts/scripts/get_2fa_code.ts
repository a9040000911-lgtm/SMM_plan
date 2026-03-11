export { };
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching 2FA codes...');
    const users = await prisma.user.findMany({
        where: {
            twoFactorCode: { not: null }
        },
        select: {
            email: true,
            twoFactorCode: true,
            updatedAt: true
        }
    });

    if (users.length === 0) {
        console.log('No active 2FA codes found.');
    } else {
        users.forEach((u: any) => {
            console.log(`User: ${u.email} | Code: ${u.twoFactorCode} | Time: ${u.updatedAt}`);
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
