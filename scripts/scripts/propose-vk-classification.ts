import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Репликация логики из service-analytics.ts
function suggestCategory(name: string): string {
    const n = name.toLowerCase();

    // 1. Приоритет группам/сообществам
    if (n.includes('групп') || n.includes('канал') || n.includes('сообщест') || n.includes('паблик') || n.includes('group')) {
        return 'ПОДПИСЧИКИ В ГРУППУ';
    }

    // 2. Заявки в друзья и профиль
    if (n.includes('друг') || n.includes('друз') || n.includes('заявк') || n.includes('профил') || n.includes('аккаунт') || n.includes('личн') || n.includes('friend')) {
        return 'ЗАЯВКИ В ДРУЗЬЯ (ПРОФИЛЬ)';
    }

    // 3. Если просто "Подписчики" без уточнения (для VK обычно профиль)
    if (n.includes('подписчи')) {
        return 'ЗАЯВКИ В ДРУЗЬЯ (ПРОФИЛЬ)';
    }

    return 'ДРУГОЕ';
}

async function main() {
    const services = await prisma.providerService.findMany({
        where: { platform: 'VK' },
        select: { id: true, name: true, category: true }
    });

    const proposal = services
        .map(s => ({
            id: s.id,
            name: s.name,
            current: s.category,
            proposed: suggestCategory(s.name)
        }))
        .filter(p =>
            ['SUBSCRIBERS', 'FRIENDS', 'GROUPS'].includes(p.current) ||
            ['ПОДПИСЧИКИ В ГРУППУ', 'ЗАЯВКИ В ДРУЗЬЯ (ПРОФИЛЬ)'].includes(p.proposed)
        );

    console.log('| ID | Название | Текущая категория | Предложенная (ИИ) |');
    console.log('|---|---|---|---|');
    proposal.forEach(p => {
        // Не показываем лайки и прочее, даже если там есть слово "группа" в описании (для чистоты)
        if (p.current === 'LIKES' || p.current === 'VIEWS' || p.current === 'COMMENTS') return;

        console.log(`| ${p.id} | ${p.name} | ${p.current} | **${p.proposed}** |`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
