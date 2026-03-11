
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
    const transactions = await prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { order: true }
    });

    console.log('--- Transactions Verification ---');
    transactions.forEach(tx => {
        console.log(`[${tx.type}] Status: ${tx.status} | Amount: ${tx.amount} | OrderId: ${tx.orderId || 'None'} | Desc: ${(tx.metadata as any)?.description || '-'}`);
    });

    const orders = await prisma.order.findMany({
        take: 10,
        include: { internalService: true }
    });
    console.log('\n--- Orders Verification ---');
    orders.forEach(o => {
        console.log(`Order: ${o.id} | Status: ${o.status} | Service: ${o.internalService.name} | Link: ${o.link}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
