import { prisma } from '../src/lib/prisma';
import { Platform } from '../src/generated/client';

const PROJECT_ID = 'f439f60b-f4e4-4013-8402-b1d7b61383fe';
const DRY_RUN = process.env.DRY_RUN !== 'false';

const KEYWORD_MAP: Record<string, string> = {
    'реакци': 'Реакции',
    'подписчик': 'Подписчики',
    'фолловер': 'Подписчики',
    'друзья': 'Подписчики',
    'участники': 'Подписчики',
    'просмотр': 'Просмотры',
    'зрители': 'Просмотры',
    'глазик': 'Просмотры',
    'лайк': 'Лайки',
    'буст': 'Бусты',
    'boost': 'Бусты',
    'коммент': 'Комментарии',
    'звезд': 'Звезды',
    'stars': 'Звезды',
    'стори': 'Сториз',
    'story': 'Сториз',
    'репост': 'Репосты',
    'сохране': 'Репосты',
    'favorites': 'Репосты',
    'переслать': 'Репосты',
};

async function main() {
    console.log(`--- CLEANUP ORPHANED SERVICES (${DRY_RUN ? 'DRY RUN' : 'EXECUTE'}) ---`);

    const orphans = await prisma.internalService.findMany({
        where: { categoryId: null },
        include: { orders: { take: 1 }, providerMappings: true }
    });

    const categories = await prisma.serviceCategory.findMany({
        where: { projectId: PROJECT_ID }
    });

    let linkedCount = 0;
    let deletedCount = 0;
    let skippedCount = 0;

    for (const service of orphans) {
        const nameLower = service.name.toLowerCase();

        // 1. Check for test services
        const isTest = nameLower.includes('test') || nameLower.includes('тест');
        const hasHistory = service.orders.length > 0 || service.providerMappings.length > 0;

        if (isTest || (!hasHistory && !nameLower.includes('реакция'))) {
            console.log(`[DELETE] ${service.name} (${service.platform}) - Test or no history.`);
            if (!DRY_RUN) {
                await prisma.internalService.delete({ where: { id: service.id } });
            }
            deletedCount++;
            continue;
        }

        // 2. Try to match category
        let matchedCatId = null;
        for (const [keyword, catName] of Object.entries(KEYWORD_MAP)) {
            if (nameLower.includes(keyword)) {
                const cat = categories.find(c =>
                    c.name.toLowerCase().includes(catName.toLowerCase()) &&
                    c.platform === service.platform
                );
                if (cat) {
                    matchedCatId = cat.id;
                    console.log(`[LINK] ${service.name} (${service.platform}) -> Category: ${cat.name} (${cat.id})`);
                    break;
                }
            }
        }

        if (matchedCatId) {
            if (!DRY_RUN) {
                await prisma.internalService.update({
                    where: { id: service.id },
                    data: { categoryId: matchedCatId }
                });
            }
            linkedCount++;
        } else {
            // User said: "либо удали эти услуги... либо найди полное соответствие"
            // If we didn't find a match, we delete it.
            console.log(`[DELETE] ${service.name} (${service.platform}) - No matching category found.`);
            if (!DRY_RUN) {
                await prisma.internalService.delete({ where: { id: service.id } });
            }
            deletedCount++;
        }
    }

    console.log(`\n--- SUMMARY ---`);
    console.log(`Linked: ${linkedCount}`);
    console.log(`Deleted: ${deletedCount}`);
    console.log(`Skipped: ${skippedCount}`);

    if (DRY_RUN) {
        console.log(`\n*** THIS WAS A DRY RUN. No changes were made to the database. ***`);
        console.log(`Run with DRY_RUN=false to apply changes.`);
    }

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
