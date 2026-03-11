import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function suggestCategory(name: string, description: string = ''): string {
    const n = (name + ' ' + description).toLowerCase();

    // 1. ПРИОРИТЕТ: Явные маркеры целевого назначения (Группы / Друзья)
    // Если написано "[в группу]" или "в друзья", это важнее чем наличие слова "лайки" в бонусах
    if (n.includes('[в группу]') || n.includes('(в группу)') || n.includes('[в сообщество]') || n.includes('в группу') || n.includes('в сообщество')) {
        return 'GROUPS';
    }
    if (n.includes('[в друзья]') || n.includes('(в друзья)') || n.includes('[на профиль]') || n.includes('в друзья') || n.includes('на профиль')) {
        return 'FRIENDS';
    }

    // 2. Контентные категории
    if (n.includes('like') || n.includes('лайк') || n.includes('сердечк') || n.includes('мне нравится')) return 'LIKES';
    if (n.includes('view') || n.includes('просмотр') || n.includes('гляделок') || n.includes('глаз') || n.includes('охват')) return 'VIEWS';
    if (n.includes('repost') || n.includes('share') || n.includes('репост') || n.includes('поделиться')) return 'REPOSTS';
    if (n.includes('comment') || n.includes('отзыв') || n.includes('коммент')) return 'COMMENTS';
    if (n.includes('poll') || n.includes('vote') || n.includes('опрос') || n.includes('голос')) return 'POLLS';

    // 3. Группы / Друзья по ключевым словам
    const hasGroup = n.includes('групп') || n.includes('канал') || n.includes('сообщест') || n.includes('паблик') || n.includes('group');
    const hasProfile = n.includes('друг') || n.includes('друз') || n.includes('заявк') || n.includes('профил') || n.includes('аккаунт') || n.includes('личн') || n.includes('friend');

    if (hasGroup && hasProfile) return 'SUBSCRIBERS';
    if (hasGroup) return 'GROUPS';
    if (hasProfile || n.includes('подписчи')) return 'FRIENDS';

    return 'SUBSCRIBERS';
}

function suggestTargetType(name: string, description: string = '', category: string): string {
    const n = (name + ' ' + description).toLowerCase();

    if (category === 'GROUPS') return 'VK_GROUP';
    if (category === 'FRIENDS') return 'VK_PROFILE';

    const hasClip = n.includes('clip') || n.includes('клип');
    const hasVideo = n.includes('video') || n.includes('видео') || n.includes('ролик');

    if (hasClip && hasVideo) return 'VIDEO';
    if (hasClip) return 'VK_CLIP';
    if (hasVideo) return 'VK_VIDEO';

    if (category === 'LIKES' || category === 'VIEWS' || category === 'REPOSTS') return 'POST';

    return 'POST';
}

async function main() {
    const services = await prisma.providerService.findMany({
        where: { platform: 'VK' },
        include: { mappings: { include: { internalService: true } } }
    });

    console.log(`Analyzing ${services.length} VK services...`);

    let count = 0;
    for (const s of services) {
        const description = (s.rawData as any)?.description || '';
        const proposedCat = suggestCategory(s.name, description);
        const proposedTarget = suggestTargetType(s.name, description, proposedCat);

        let updated = false;

        // Update ProviderService Category
        if (proposedCat !== s.category) {
            await prisma.providerService.update({
                where: { id_providerId: { id: s.id, providerId: s.providerId } },
                data: { category: proposedCat as any }
            });
            console.log(`Updated Provider [${s.id}] Category: ${s.category} -> ${proposedCat}`);
            updated = true;
        }

        // Update InternalService Category & TargetType
        for (const m of s.mappings) {
            const is = m.internalService;
            if (is && (is.category !== proposedCat || is.targetType !== proposedTarget)) {
                await prisma.internalService.update({
                    where: { id: is.id },
                    data: {
                        category: proposedCat as any,
                        targetType: proposedTarget
                    }
                });
                console.log(`Updated Internal [${is.id}] ${is.name}: ${is.category}/${is.targetType} -> ${proposedCat}/${proposedTarget}`);
                updated = true;
            }
        }

        if (updated) count++;
    }

    console.log(`Total updated services (Provider or Internal): ${count}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
