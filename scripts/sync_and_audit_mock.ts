import { prisma } from '../src/lib/prisma';
import { ServiceSyncService } from '../src/services/providers/sync.service';
import { SmartAnalyzerService } from '../src/services/providers/smart-analyzer.service';

async function run() {
    console.log('🔄 Fetching all Mock Providers...');
    const providers = await prisma.provider.findMany({
        where: { name: { contains: 'Mock' } }
    });

    console.log(`✅ Found ${providers.length} Mock Providers. Connecting to local mock routes...`);

    const distribution: Record<string, Record<string, number>> = {};
    let totalServicesCount = 0;

    for (const provider of providers) {
        console.log(`\n⏳ SYNCING [${provider.name}] | URL: ${provider.apiUrl}`);
        try {
            await ServiceSyncService.syncProvider(provider.id);
            console.log(`✅ Sync complete for ${provider.name}`);
        } catch(e: any) {
            console.error(`❌ Sync failed for ${provider.name}: ${e.message}`);
        }

        const providerServices = await prisma.providerService.findMany({
            where: { providerId: provider.id } // Only newly synced ones
        });

        totalServicesCount += providerServices.length;

        for (const raw of providerServices) {
            const analysis = SmartAnalyzerService.detectSync(raw.name, (raw.rawData as any)?.description || '', raw.category || '');
            
            const platform = analysis.platform || 'UNKNOWN';
            const category = analysis.category || 'UNKNOWN';

            if (!distribution[platform]) distribution[platform] = {};
            if (!distribution[platform][category]) distribution[platform][category] = 0;

            distribution[platform][category]++;
        }
    }

    console.log(`\n📊 ТАКСОНОМИЯ (${totalServicesCount} услуг):\n`);
    for (const platform of Object.keys(distribution).sort()) {
        console.log(`🔹 ${platform.toUpperCase()}`);
        for (const cat of Object.keys(distribution[platform]).sort()) {
            console.log(`   ├─ ${cat}: ${distribution[platform][cat]} услуг`);
        }
        console.log('');
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
