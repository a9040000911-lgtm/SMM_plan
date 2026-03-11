
import { prisma } from '../src/lib/prisma';

async function main() {
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: '0c118b28-7b86-4536-a9ad-e74a084ab48a' },
        include: { messages: true }
    });
    console.log('Ticket Messages:', JSON.stringify(ticket?.messages, null, 2));
}

main().catch(console.error);
