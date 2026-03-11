import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const platforms = await prisma.socialPlatform.findMany();
    console.log("Platforms:", platforms.map(p => p.slug));

    const categories = await prisma.serviceCategory.findMany({
        include: { socialPlatform: true }
    });

    console.log("\nCategories by Platform:");
    const grouped: Record<string, any[]> = {};
    for (const cat of categories) {
        const pSlug = cat.socialPlatform?.slug || 'UNKNOWN';
        if (!grouped[pSlug]) grouped[pSlug] = [];
        grouped[pSlug].push({ name: cat.name, targetType: cat.targetType });
    }

    for (const [p, cats] of Object.entries(grouped)) {
        console.log(`\n--- ${p} ---`);
        for (const c of cats) {
            console.log(`  - ${c.name} (targetType: ${c.targetType})`);
        }
    }

    const internalCount = await prisma.internalService.count();
    console.log(`\nExisting InternalServices: ${internalCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
