import { prisma } from '../src/lib/prisma';

async function readLogs() {
    console.log('--- Recent Admin Logs ---');
    const logs = await prisma.adminLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' }
    });

    console.log(JSON.stringify(logs, null, 2));
}

readLogs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
