
import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSING 2FA ERRORS ---');

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
            twoFactorCode: { not: null }
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
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
