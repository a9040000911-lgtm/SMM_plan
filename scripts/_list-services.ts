import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const services = await prisma.internalService.findMany({
        take: 10,
        select: { id: true, name: true, socialPlatformId: true, categoryId: true }
    });
    for (const s of services) {
        console.log(`${s.id} | ${s.name} | plat=${s.socialPlatformId} | cat=${s.categoryId}`);
    }
    
    // Check what mappings exist
    const mappingCount = await prisma.internalServiceMapping.count();
    console.log(`\nВсего маппингов: ${mappingCount}`);
    
    // Show first mapping with provider info
    const sample = await prisma.internalServiceMapping.findFirst({
        include: { provider: true, providerService: true }
    });
    if (sample) {
        console.log(`\nПример маппинга:`);
        console.log(`  InternalServiceId: ${sample.internalServiceId}`);
        console.log(`  Provider: ${sample.provider.name}`);
        console.log(`  ProviderService: ${sample.providerService?.name || 'NULL'} (ext: ${sample.providerService?.externalId})`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
