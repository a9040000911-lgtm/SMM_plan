import { prisma } from '../src/lib/prisma';

/**
 * Script to verify the bot catalog structure (categories and services)
 * This simulates what the bot would fetch for each platform.
 */

async function main() {
    console.log('--- BOT CATALOG VERIFICATION ---');

    const platforms = await prisma.socialPlatform.findMany({
        where: { isActive: true },
        include: {
            internalServices: {
                where: { isActive: true },
                include: { serviceCategory: true }
            }
        }
    });

    for (const p of platforms) {
        console.log(`\n[PLATFORM] ${p.name} (${p.slug})`);

        // Fetch categories as the refactored bot does
        const categories = await prisma.serviceCategory.findMany({
            where: {
                projectId: 'f439f60b-f4e4-4013-8402-b1d7b61383fe', // Active project
                platform: p.slug.toUpperCase() as any,
                isActive: true,
                internalServices: { some: { isActive: true } }
            },
            orderBy: { priority: 'desc' }
        });

        if (categories.length === 0) {
            console.log('  (No active categories)');
            continue;
        }

        for (const cat of categories) {
            const serviceCount = await prisma.internalService.count({
                where: { categoryId: cat.id, isActive: true }
            });
            console.log(`  - [CAT] ${cat.name} (${serviceCount} services)`);
        }

        // Check for orphaned services in the DB that won't show up in the bot
        const orphans = await prisma.internalService.count({
            where: {
                socialPlatformId: p.id,
                isActive: true,
                categoryId: null
            }
        });

        if (orphans > 0) {
            console.warn(`  !!! CRITICAL: ${orphans} active services have NO categoryId and will HIDDEN in the bot !!!`);
        }
    }

    console.log('\n--- VERIFICATION DONE ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
