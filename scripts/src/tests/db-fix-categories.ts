import { PrismaClient } from '@prisma/client';

// Simple detection logic copied from smart-analyzer.logic.ts to be standalone
function detectCategoryVK(name: string) {
    const n = name.toLowerCase();
    const hasViewKeywords = n.includes('просмотр') || n.includes('глазик') || n.includes('охват') || n.includes('view') || n.includes('eye');
    const hasVideoKeywords = n.includes('видео') || n.includes('video') || n.includes('clip') || n.includes('клип') || n.includes('товар') || n.includes('услуг');

    if (hasViewKeywords && hasVideoKeywords) return 'VIEWS';
    if (n.includes('в друзья') || n.includes('на профиль') || n.includes('на страницу')) return 'FRIENDS';
    if (n.includes('в группу') || n.includes('в сообщество') || n.includes('паблик')) return 'GROUPS';
    if (n.includes('подкаст') || n.includes('прослушиван') || n.includes('плейлист')) return 'PLAYS';
    if (hasViewKeywords || n.includes('на запись') || n.includes('на пост')) return 'VIEWS';
    if (n.includes('опрос') || n.includes('голос')) return 'POLLS';
    return null;
}

const prisma = new PrismaClient();

async function fixCategories() {
    try {
        console.log("Checking for miscategorized VK services...");

        const vkServices = await prisma.internalService.findMany({
            where: { platform: 'VK' }
        });

        let fixedCount = 0;
        for (const service of vkServices) {
            const suggestedCategory = detectCategoryVK(service.name);

            if (suggestedCategory && suggestedCategory !== service.category) {
                console.log(`Fixing "${service.name}": ${service.category} -> ${suggestedCategory}`);

                // Find or create the target category for this platform/type
                // Note: targetType might also need update but let's focus on category first
                // We use a simplified resolve logic here

                await prisma.internalService.update({
                    where: { id: service.id },
                    data: { category: suggestedCategory as any }
                });
                fixedCount++;
            }
        }

        console.log(`\nFinished. Fixed ${fixedCount} services.`);

        // Cleanup empty categories
        const categories = await prisma.serviceCategory.findMany({
            include: { _count: { select: { services: true } } }
        });

        const emptyCats = categories.filter(c => c._count.services === 0);
        if (emptyCats.length > 0) {
            console.log(`Deleting ${emptyCats.length} empty categories...`);
            await prisma.serviceCategory.deleteMany({
                where: { id: { in: emptyCats.map(c => c.id) } }
            });
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

fixCategories();
