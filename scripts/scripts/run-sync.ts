import { ServiceSyncService } from '../src/services/providers/sync.service';
import { OrderSyncService } from '../src/services/orders/order-sync.service';

async function main() {
    console.log('--- STARTING SYNC ---');
    if (process.argv.includes('--services')) {
        console.log('--- Syncing Services ---');
        await ServiceSyncService.syncAllServices();
    }

    if (process.argv.includes('--orders')) {
        console.log('--- Syncing Orders ---');
        await OrderSyncService.syncAllActive();
    }
    console.log('--- SYNC FINISHED ---');
}

main().catch(console.error);
