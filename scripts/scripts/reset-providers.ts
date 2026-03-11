
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetProviders() {
  console.log('🗑️  Starting provider reset...');

  try {
    // 1. Delete all InternalServiceMappings (Cascades from Provider, but let's be explicit/safe)
    const deletedMappings = await prisma.internalServiceMapping.deleteMany({});
    console.log(`✅ Deleted ${deletedMappings.count} service mappings.`);

    // 2. Delete all ProviderServices (Cascades from Provider)
    const deletedServices = await prisma.providerService.deleteMany({});
    console.log(`✅ Deleted ${deletedServices.count} provider services.`);

    // 3. Delete all ProviderBalanceLogs
    const deletedLogs = await prisma.providerBalanceLog.deleteMany({});
    console.log(`✅ Deleted ${deletedLogs.count} balance logs.`);

    // 4. Delete all Providers
    const deletedProviders = await prisma.provider.deleteMany({});
    console.log(`✅ Deleted ${deletedProviders.count} providers.`);

    console.log('\n🎉 Provider reset complete. You can now re-add providers and re-sync services.');
  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetProviders();

