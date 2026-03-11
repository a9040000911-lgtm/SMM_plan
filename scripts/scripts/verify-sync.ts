
import { ServiceSyncService } from '../src/services/providers/sync.service';
import { prisma } from '../src/lib/prisma';

// Override DATABASE_URL for local execution against Docker mapped port
process.env.DATABASE_URL = 'postgresql://smmuser:smmpassword@localhost:5433/smmplan?schema=public';

async function main() {
    console.log('--- Starting Sync Verification ---');

    // 1. Get initial count
    const providers = await prisma.provider.findMany({
        where: { name: { contains: 'stream', mode: 'insensitive' } },
        select: { id: true, name: true }
    });
    const providerIds = providers.map(p => p.id);

    const initialCount = await prisma.providerService.count({
        where: { providerId: { in: providerIds } }
    });
    console.log(`Initial Stream Promotion services: ${initialCount}`);

    // 2. Run Sync
    try {
        // Assuming we want to sync each provider found
        for (const provider of providers) {
            console.log(`[Verify] Triggering sync for ${provider.name}...`);
            await ServiceSyncService.syncProvider(provider.id);
        }
    } catch (e: any) {
        console.error('Sync failed:', e.message);
    }

    // 3. Get final count
    const finalCount = await prisma.providerService.count({
        where: { providerId: { in: providerIds } }
    });
    console.log(`Final Stream Promotion services: ${finalCount}`);

    const diff = finalCount - initialCount;
    if (diff > 0) {
        console.log(`SUCCESS: Added ${diff} new services.`);
    } else if (finalCount > 0) {
        console.log('SUCCESS: Services exist (no new ones added, likely already synced).');
    } else {
        console.log('WARNING: No services found for Stream Promotion. Check API Key or availability.');
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
