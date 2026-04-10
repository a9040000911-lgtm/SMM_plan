import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- ПОИСК ЗАБЛОКИРОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ ---');
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { isPermanentlyBanned: true },
                { banExpiresAt: { gt: new Date() } }
            ]
        },
        select: {
            id: true,
            username: true,
            tgId: true,
            isPermanentlyBanned: true,
            banExpiresAt: true,
            warningCount: true,
            moderationNote: true
        }
    });

    if (users.length === 0) {
        console.log('Заблокированных пользователей не найдено.');
    } else {
        console.log(`Найдено пользователей: ${users.length}`);
        users.forEach(u => {
            console.log(`- [@${u.username || 'no_username'}] ID: ${u.id}, TG: ${u.tgId}`);
            console.log(`  Статус: ${u.isPermanentlyBanned ? 'ПЕРМАНЕНТ' : 'ВРЕМЕННЫЙ'}`);
            console.log(`  Истекает: ${u.banExpiresAt}`);
            console.log(`  Варны: ${u.warningCount}`);
            console.log(`  Заметка: ${u.moderationNote}`);
            console.log('-------------------');
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
