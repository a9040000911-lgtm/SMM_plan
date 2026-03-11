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


async function syncNames() {
    try {
        console.log("Syncing category names and icons...");
        const categories = await prisma.serviceCategory.findMany();

        let count = 0;
        for (const cat of categories) {
            const expectedName = CATEGORY_DISPLAY_NAMES[cat.categoryType];
            const expectedIcon = CATEGORY_ICONS[cat.categoryType];

            if (expectedName && (cat.name !== expectedName || cat.icon !== expectedIcon)) {
                console.log(`Updating category ${cat.id}: "${cat.name}" -> "${expectedName}"`);
                await prisma.serviceCategory.update({
                    where: { id: cat.id },
                    data: {
                        name: expectedName,
                        icon: expectedIcon || cat.icon
                    }
                });
                count++;
            }
        }

        console.log(`Updated ${count} categories.`);

        // Also fix the targetTypes that were incorrectly guessed
        const wrongTargetTypes = await prisma.internalService.findMany({
            where: {
                platform: 'VK',
                targetType: 'VK_PLAY_LIVE',
                OR: [
                    { name: { contains: 'пост', mode: 'insensitive' } },
                    { name: { contains: 'товар', mode: 'insensitive' } }
                ]
            }
        });

        console.log(`Fixing ${wrongTargetTypes.length} wrong target types for VK...`);
        for (const s of wrongTargetTypes) {
            await prisma.internalService.update({
                where: { id: s.id },
                data: { targetType: 'POST' }
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

syncNames();
