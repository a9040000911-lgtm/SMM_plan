import { prisma } from '../src/lib/prisma';
import { SmartAnalyzerService } from '../src/services/providers/smart-analyzer.service';

/**
 * Audit VexBoost Mock raw services and show how SmartAnalyzer maps them
 * to Social Platforms and Categories without actually mutating InternalServices.
 */
async function run() {
    console.log('🔄 Fetching ProviderServices for VexBoost Mock...');
    const providerServices = await prisma.providerService.findMany({
        where: { provider: { name: 'VexBoost Mock' } }
    });

    console.log(`✅ Found ${providerServices.length} raw services. Analyzing taxonomy...`);

    const distribution: Record<string, Record<string, number>> = {};

    for (const raw of providerServices) {
        // Use the system's smart parser
        const analysis = SmartAnalyzerService.detectSync(raw.name, (raw.rawData as any)?.description || '', raw.category || '');
        
        const platform = analysis.platform || 'UNKNOWN';
        const category = analysis.category || 'UNKNOWN';

        if (!distribution[platform]) distribution[platform] = {};
        if (!distribution[platform][category]) distribution[platform][category] = 0;

        distribution[platform][category]++;
    }

    console.log('\n📊 ТАКСОНОМИЯ (ПЛАТФОРМА -> КАТЕГОРИИ):\n');
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
