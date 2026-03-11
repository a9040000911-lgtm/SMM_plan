
import { prisma } from '../src/lib/prisma';

async function main() {
    const messages = await prisma.supportMessage.findMany({
        where: { ticketId: 'cc0c9d38-99c4-4f86-9fb9-767976f1e9d7' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('Recent Messages for Ticket:', JSON.stringify(messages, null, 2));
}

main().catch(console.error);
