
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.providerService.count();
        console.log(`Total Provider Services: ${count}`);

        if (count > 0) {
            const first = await prisma.providerService.findFirst();
            console.log('Sample service:', first);
        } else {
            console.log('No provider services found.');
        }

        // Check Internal Services that have mappings
        const mappedServices = await prisma.internalServiceMapping.count();
        console.log(`Total Mapped Services: ${mappedServices}`);

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
