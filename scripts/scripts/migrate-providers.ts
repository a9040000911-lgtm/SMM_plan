import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Provider ID Migration...\n');

    // 1. Get all providers
    const providers = await prisma.provider.findMany();
    console.log(`Found ${providers.length} providers.`);

    for (const provider of providers) {
        console.log(`Processing ${provider.name}...`);

        // Determine driver type (heuristic)
        let type = 'universal';
        const nameLower = provider.name.toLowerCase();
        if (nameLower.includes('vexboost')) type = 'vexboost';
        if (nameLower.includes('stream')) type = 'stream-promotion';

        // Update Provider type
        await prisma.provider.update({
            where: { id: provider.id },
            data: { type }
        });

        // NOTE: The following logic used providerName which has been removed from the Prisma schema.
        // If you need to re-run migration, you must use raw queries or restore the field in schema.
        /*
        // Update ProviderService records
        const svcUpdate = await prisma.providerService.updateMany({
            where: { providerName: provider.name } as any,
            data: { providerId: provider.id }
        });
        console.log(`   - Updated ${svcUpdate.count} ProviderServices`);

        // Update InternalServiceMapping records
        const mappingUpdate = await prisma.internalServiceMapping.updateMany({
            where: { providerName: provider.name } as any,
            data: { providerId: provider.id }
        });
        console.log(`   - Updated ${mappingUpdate.count} InternalServiceMappings`);
        */
        console.log('   - Skipped service/mapping updates (providerName field removed)');
    }

    console.log('\n✅ Migration Complete.');
}

main()
    .catch(e => console.error('❌ Migration failed:', e))
    .finally(async () => await prisma.$disconnect());
