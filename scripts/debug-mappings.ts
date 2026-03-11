import { prisma } from '../src/lib/prisma';

async function main() {
    const serviceId = 'clsc2zqgq0000e8zz90ge9dss_1188';

    const allMappings = await prisma.internalServiceMapping.findMany({
        where: { internalServiceId: serviceId }
    });

    console.log(`All mappings for service ${serviceId}:`);
    console.log(allMappings);

    process.exit(0);
}

main().catch(console.error);
