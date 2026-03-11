import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Standalone VK category detection logic
function detectCategoryVK(name: string) {
    const n = name.toLowerCase();
    const hasViewKeywords = n.includes('просмотр') || n.includes('глазик') || n.includes('охват') || n.includes('view') || n.includes('eye');
    const hasVideoKeywords = n.includes('видео') || n.includes('video') || n.includes('clip') || n.includes('клип') || n.includes('товар') || n.includes('услуг') || n.includes('посещен');
    const isStream = n.includes('зрител') || n.includes('stream') || n.includes('стрим') || n.includes('online') || n.includes('онлайн');

    if (isStream) return 'STREAMS';
    if (hasViewKeywords && hasVideoKeywords) return 'VIEWS';
    if (n.includes('в друзья') || n.includes('на профиль') || n.includes('на страницу')) return 'FRIENDS';
    if (n.includes('в группу') || n.includes('в сообщество') || n.includes('паблик')) return 'GROUPS';
    if (n.includes('подкаст') || n.includes('прослушиван') || n.includes('плейлист') || n.includes('альбом')) return 'PLAYS';
    if (hasViewKeywords || n.includes('на запись') || n.includes('на пост')) return 'VIEWS';
    if (n.includes('опрос') || n.includes('голос')) return 'POLLS';
    return null;
}

async function fixProviderServices() {
    try {
        console.log("Fixing ProviderService categories...");
        const providerServices = await prisma.providerService.findMany({
            where: { platform: 'VK' }
        });

        let count = 0;
        for (const ps of providerServices) {
            const suggested = detectCategoryVK(ps.name);
            if (suggested && suggested !== ps.category) {
                console.log(`Fixing PS "${ps.name}": ${ps.category} -> ${suggested}`);
                await prisma.providerService.update({
                    where: { id: ps.id },
                    data: { category: suggested as any }
                });
                count++;
            }
        }
        console.log(`Updated ${count} ProviderService records.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixProviderServices();
