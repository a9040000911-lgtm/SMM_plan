import { prisma } from '../src/lib/prisma';
import { OrderQueueService } from '../src/services/orders/order-queue.service';

const ORDER_ID = 4;

async function main() {
    console.log(`Setting order ${ORDER_ID} back to PENDING...`);

    await prisma.order.update({
        where: { id: ORDER_ID },
        data: { status: 'PENDING' }
    });

    console.log('Running queue processor...');
    await OrderQueueService.processPendingOrders();

    const finalCheck = await prisma.order.findUnique({ where: { id: ORDER_ID } });
    console.log(`Final order ${ORDER_ID} status:`, finalCheck?.status);
    console.log(`Provider Name:`, finalCheck?.providerName);
    console.log(`External ID:`, finalCheck?.externalId);

    process.exit(0);
}

main().catch(console.error);
