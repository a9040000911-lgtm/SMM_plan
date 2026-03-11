import { prisma } from '../src/lib/prisma';
import { Category } from '../src/generated/client';

/**
 * Script to synchronize InternalService.category (enum) with ServiceCategory.name
 * This ensures that even if the bot logic relies on the enum, it displays the correct names
 * (though we plan to refactor the bot to use the model directly).
 */

const CATEGORY_MAP: Record<string, Category> = {
    'подписчики': 'SUBSCRIBERS',
    'лайки': 'LIKES',
    'просмотры': 'VIEWS',
    'реакции': 'REACTIONS',
    'репосты': 'REPOSTS',
    'комментарии': 'COMMENTS',
    'бусты': 'BOOSTS',
    'опросы': 'POLLS',
    'голоса': 'POLLS',
    'истории': 'STORIES',
    'сториз': 'STORIES',
    'боты': 'BOTS',
    'рефералы': 'REFERRALS',
    'друзья': 'FRIENDS',
    'прослушивания': 'PLAYS',
    'трафик': 'TRAFFIC',
    'дизлайки': 'DISLIKES',
    'группы': 'GROUPS',
    'чаты': 'GROUPS',
    'стримы': 'STREAMS',
    'зрители': 'STREAMS',
    'часы просмотра': 'WATCH_TIME',
    'сохранения': 'SAVES',
    'звезды': 'STARS',
    'премиум': 'PREMIUM'
};

async function main() {
    console.log('--- SYNCING CATEGORY ENUMS ---');

    const services = await prisma.internalService.findMany({
        include: { serviceCategory: true }
    });

    let updatedCount = 0;

    for (const service of services) {
        if (!service.serviceCategory) continue;

        const catNameLower = service.serviceCategory.name.toLowerCase();
        let targetEnum: Category | undefined;

        // Try direct keyword match
        for (const [kw, enumVal] of Object.entries(CATEGORY_MAP)) {
            if (catNameLower.includes(kw)) {
                targetEnum = enumVal;
                break;
            }
        }

        if (targetEnum && targetEnum !== service.category) {
            console.log(`[SYNC] ${service.name}: ${service.category} -> ${targetEnum} (via ${service.serviceCategory.name})`);
            await prisma.internalService.update({
                where: { id: service.id },
                data: { category: targetEnum }
            });
            updatedCount++;
        }
    }

    console.log(`\nDONE. Updated ${updatedCount} services.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
