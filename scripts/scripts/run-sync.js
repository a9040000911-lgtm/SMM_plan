const { ServiceSyncService } = require('../src/services/providers/sync.service');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
    console.log('--- STARTING PROVIDER SYNC ---');
    await ServiceSyncService.syncAllServices();
    console.log('--- SYNC FINISHED ---');
}

main().catch(console.error);
