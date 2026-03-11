
const { PrismaClient } = require('../src/generated/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSING 2FA ERRORS (JS) ---');

    try {
        const logs = await prisma.adminLog.findMany({
            where: {
                action: { in: ['AUTH_2FA_FAILED', 'AUTH_PASSWORD_OK', 'AUTH_TG_OK', 'AUTH_SUCCESS'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log('Recent Auth Logs:');
        logs.forEach(log => {
            console.log(`[${log.createdAt.toISOString()}] ${log.action}: ${log.details}`);
        });

        const usersWithCodes = await prisma.user.findMany({
            where: {
                NOT: { twoFactorCode: null }
            },
            select: {
                email: true,
                twoFactorCode: true,
                twoFactorExpires: true
            }
        });

        console.log('\nUsers currently waiting for 2FA:');
        console.log(JSON.stringify(usersWithCodes, null, 2));

        console.log('\nCurrent Server Time:', new Date().toISOString());
    } catch (err) {
        console.error('Database query failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
