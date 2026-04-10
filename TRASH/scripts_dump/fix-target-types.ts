
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- NORMALIZING TARGET TYPES ---');

    // 1. TG_CHANNEL -> CHANNEL
    const r1 = await prisma.internalService.updateMany({
        where: { targetType: 'TG_CHANNEL' },
        data: { targetType: 'CHANNEL' }
    });
    console.log(`Updated TG_CHANNEL to CHANNEL: ${r1.count}`);

    // 2. TG_GROUP -> CHANNEL
    const r2 = await prisma.internalService.updateMany({
        where: { targetType: 'TG_GROUP' },
        data: { targetType: 'CHANNEL' }
    });
    console.log(`Updated TG_GROUP to CHANNEL: ${r2.count}`);

    // 3. COMMENT -> POST (or check if bot handles POST)
    // Actually, LinkService says TG_POST targetType matches POST.
    const r3 = await prisma.internalService.updateMany({
        where: { targetType: 'COMMENT' },
        data: { targetType: 'POST' }
    });
    console.log(`Updated COMMENT to POST: ${r3.count}`);

    console.log('\n✅ Normalization finished.');
}

main().catch(console.error);
