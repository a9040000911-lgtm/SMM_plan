import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- LISTING ORPHANED INTERNAL SERVICES ---');
    try {
        const orphans = await prisma.internalService.findMany({
            where: { categoryId: null },
            select: { id: true, name: true, platform: true }
        });
        console.log(`Total Orphans Found: ${orphans.length}`);
        console.log(JSON.stringify(orphans, null, 2));
    } catch (e: any) {
        console.error('Error fetching orphans:', e.message);
    }
    process.exit(0);
}

main();
