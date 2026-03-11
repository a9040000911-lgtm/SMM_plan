
import { prisma } from '../src/lib/prisma';

async function main() {
    const targetTypes = await prisma.internalService.groupBy({
        by: ['targetType'],
        _count: {
            id: true
        }
    });

    console.log('Current targetType counts in DB:');
    targetTypes.forEach(t => {
        console.log(`- ${t.targetType}: ${t._count.id}`);
    });

    const platforms = await prisma.internalService.groupBy({
        by: ['platform', 'targetType'],
        _count: {
            id: true
        }
    });

    console.log('\nBreakdown by Platform:');
    platforms.forEach(p => {
        console.log(`- ${p.platform} | ${p.targetType}: ${p._count.id}`);
    });
}

main().catch(console.error);
