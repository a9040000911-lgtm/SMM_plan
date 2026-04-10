import { prisma } from "../src/lib/prisma";

async function main() {
    const internalCount = await prisma.internalService.count();
    const mappingCount = await prisma.internalServiceMapping.count();
    const providerCount = await prisma.providerService.count();
    console.log(`InternalServices: ${internalCount}`);
    console.log(`Mappings: ${mappingCount}`);
    console.log(`ProviderServices: ${providerCount}`);
}

main().finally(() => prisma.$disconnect());
