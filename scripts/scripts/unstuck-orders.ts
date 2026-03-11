import { OrderQueueService } from '../src/services/orders/order-queue.service';

async function main() {
    console.log('Starting explicit processing of pending orders...');
    await OrderQueueService.processPendingOrders();
    console.log('Finished processing pending orders!');
    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
