import { prisma } from '../src/lib/prisma';
import { ServiceEngine } from '../src/services/admin/service-engine';

async function main() {
    console.log('🧪 Testing ServiceEngine...');

    // 1. Get a random provider service
    const pService = await prisma.providerService.findFirst();
    if (!pService) {
        console.error('❌ No provider services found. Please run seed-provider-prices.ts first.');
        return;
    }

    console.log(`📡 Testing import for service: ${pService.name} (ID: ${pService.id})`);

    try {
        // We'll use a mock import since it creates a new InternalService
        const internal = await ServiceEngine.importFromProvider(pService.id, pService.providerId);
        console.log(`✅ Success! Created internal service: ${internal.id} with price ${internal.pricePer1000}`);
    } catch (e: any) {
        console.error('❌ Import failed:', e.message);
    }

    console.log('\n🔄 Testing global sync...');
    try {
        const result = await ServiceEngine.syncEverything();
        console.log(`✅ Sync finished. Updated: ${result.updatedCount}`);
    } catch (e: any) {
        console.error('❌ Sync failed:', e.message);
    }

    console.log('\n🏁 Test Finished.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
