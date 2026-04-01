import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Category Realignment...");

    const categories = await prisma.serviceCategory.findMany({});
    const platformToCategories = {};
    for (const cat of categories) {
        if (!cat.platform) continue;
        const p = cat.platform.toUpperCase();
        if (!platformToCategories[p]) platformToCategories[p] = {};
        platformToCategories[p][cat.categoryType] = cat.id;
    }

    const services = await prisma.internalService.findMany({
        include: { socialPlatform: true, serviceCategory: true }
    });

    let updatedCount = 0;

    for (const service of services) {
        const platformName = service.socialPlatform?.name?.toUpperCase() || 'TELEGRAM';
        const name = service.name.toLowerCase();
        
        let newCategoryType = null;
        const currentType = service.serviceCategory?.categoryType;

        // Smart Mapping Rules (Order matters!)
        if (name.includes('комментари') || name.includes('comment')) {
            newCategoryType = 'COMMENTS';
        } else if (name.includes('реакци') || name.includes('reaction')) {
            newCategoryType = 'REACTIONS';
        } else if (name.includes('буст') || name.includes('boost')) {
             newCategoryType = 'BOOSTS';
        } else if (name.includes('истори') || name.includes('стори') || name.includes('stories') || name.includes('story')) {
            newCategoryType = 'STORIES';
        } else if (name.includes('просмотр') || name.includes('view')) {
            newCategoryType = 'VIEWS';
        } else if (name.includes('подписч') || name.includes('subscriber') || name.includes('member') || name.includes('follower')) {
            newCategoryType = 'SUBSCRIBERS';
        } else if (name.includes('репост') || name.includes('repost') || name.includes('share')) {
            newCategoryType = 'SHARES';
        } else if (name.includes('лайк') || name.includes('like')) {
            newCategoryType = 'LIKES';
        }

        if (newCategoryType && newCategoryType !== currentType) {
            const newCatId = platformToCategories[platformName]?.[newCategoryType];
            if (newCatId) {
                console.log(`Moving [${service.id}] "${service.name}"`);
                console.log(`  from: ${currentType} -> ${newCategoryType}`);
                await prisma.internalService.update({
                    where: { id: service.id },
                    data: { categoryId: newCatId }
                });
                updatedCount++;
            }
        }
    }

    console.log(`Finished mapping ${updatedCount} services.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
