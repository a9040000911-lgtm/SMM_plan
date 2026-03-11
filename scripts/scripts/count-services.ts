
import { prisma } from '../src/lib/prisma';

async function main() {
    const serviceCount = await prisma.internalService.count();
    const categoryCount = await prisma.internalService.groupBy({
        by: ['category'],
        _count: true
    });
    const platformCount = await prisma.internalService.groupBy({
        by: ['platform'],
        _count: true
    });

    console.log(`Total Internal Services: ${serviceCount}`);
    console.log(`Platforms: ${platformCount.length}`);
    console.log(`Categories: ${categoryCount.length}`);
}

main().catch(console.error);
