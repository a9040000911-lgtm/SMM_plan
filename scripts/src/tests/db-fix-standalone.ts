import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
    'SUBSCRIBERS': 'Подписчики',
    'LIKES': 'Лайки',
    'VIEWS': 'Просмотры',
    'REACTIONS': 'Реакции',
    'REPOSTS': 'Репосты',
    'COMMENTS': 'Комментарии',
    'BOOSTS': 'Бусты',
    'POLLS': 'Опросы',
    'STORIES': 'Сториз',
    'BOTS': 'Боты',
    'REFERRALS': 'Рефералы',
    'FRIENDS': 'Друзья',
    'PLAYS': 'Прослушивания',
    'RECOVER': 'Прирост/Восстановление',
    'PREMIUM': 'Премиум',
    'TRAFFIC': 'Трафик',
    'DISLIKES': 'Дизлайки',
    'GROUPS': 'Группы',
    'STREAMS': 'Стримы',
    'WATCH_TIME': 'Время просмотра',
    'SAVES': 'Сохранения',
    'STARS': 'Звезды',
    'OTHER': 'Прочее'
};

const CATEGORY_ICONS: Record<string, string> = {
    'SUBSCRIBERS': 'users',
    'LIKES': 'heart',
    'VIEWS': 'eye',
    'REACTIONS': 'zap',
    'REPOSTS': 'share-2',
    'COMMENTS': 'message-circle',
    'BOOSTS': 'rocket',
    'POLLS': 'bar-chart-2',
    'STORIES': 'camera',
    'BOTS': 'bot',
    'REFERRALS': 'user-plus',
    'FRIENDS': 'user-check',
    'PLAYS': 'play-circle',
    'RECOVER': 'refresh-cw',
    'PREMIUM': 'star',
    'TRAFFIC': 'mouse-pointer-2',
    'DISLIKES': 'thumbs-down',
    'GROUPS': 'users-2',
    'STREAMS': 'tv',
    'WATCH_TIME': 'clock',
    'SAVES': 'bookmark',
    'STARS': 'sparkles',
    'OTHER': 'layers'
};

async function runFix() {
    try {
        console.log("Starting DB Category Fix...");

        const vkServicesToFix = await prisma.internalService.findMany({
            where: {
                platform: 'VK',
                category: 'PLAYS',
                OR: [
                    { name: { contains: 'просмотр', mode: 'insensitive' } },
                    { name: { contains: 'глазик', mode: 'insensitive' } },
                    { name: { contains: 'охват', mode: 'insensitive' } },
                    { name: { contains: 'view', mode: 'insensitive' } }
                ]
            }
        });

        console.log(`Found ${vkServicesToFix.length} VK services to move from PLAYS to VIEWS.`);

        for (const service of vkServicesToFix) {
            let targetType = service.targetType;
            const n = service.name.toLowerCase();
            if (n.includes('clip') || n.includes('клип')) targetType = 'VK_CLIP';
            else if (n.includes('video') || n.includes('видео')) targetType = 'VK_VIDEO';

            let targetCategory = await prisma.serviceCategory.findFirst({
                where: {
                    projectId: service.projectId,
                    platform: 'VK',
                    categoryType: 'VIEWS',
                    targetType: targetType
                }
            });

            if (!targetCategory) {
                console.log(`Creating new category [VK] VIEWS (${targetType}) for project ${service.projectId}`);
                targetCategory = await prisma.serviceCategory.create({
                    data: {
                        projectId: service.projectId,
                        platform: 'VK',
                        categoryType: 'VIEWS',
                        targetType: targetType,
                        name: CATEGORY_DISPLAY_NAMES['VIEWS'] || 'Просмотры',
                        icon: CATEGORY_ICONS['VIEWS'] || 'eye',
                        slug: `vk-views-${targetType.toLowerCase()}-${Math.floor(Math.random() * 1000)}`
                    }
                });
            }

            await prisma.internalService.update({
                where: { id: service.id },
                data: {
                    category: 'VIEWS',
                    targetType: targetType,
                    categoryId: targetCategory.id
                }
            });
        }

        const emptyCategories = await prisma.serviceCategory.findMany({
            where: {
                internalServices: { none: {} }
            }
        });

        if (emptyCategories.length > 0) {
            console.log(`Deleting ${emptyCategories.length} empty categories...`);
            await prisma.serviceCategory.deleteMany({
                where: { id: { in: emptyCategories.map(c => c.id) } }
            });
        }

        console.log("Fix completed successfully.");
    } catch (e) {
        console.error("Error during fix:", e);
    } finally {
        await prisma.$disconnect();
    }
}

runFix();
