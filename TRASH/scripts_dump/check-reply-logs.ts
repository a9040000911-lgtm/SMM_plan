
import { prisma } from '../src/lib/prisma';

async function main() {
    const logs = await prisma.adminLog.findMany({
        where: { action: 'TICKET_REPLY' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('Recent Reply Logs:', JSON.stringify(logs, null, 2));
}

main().catch(console.error);
