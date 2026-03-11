
import { prisma } from '../src/lib/prisma';

async function main() {
    const tgId = BigInt(268747191);

    console.log('--- HEALING ADMIN ACCOUNTS ---');

    // 1. Убеждаемся, что все аккаунты этого TG ID имеют роль ADMIN и доступ ко всему
    const result = await prisma.user.updateMany({
        where: { tgId },
        data: {
            role: 'ADMIN',
            isGlobalAdmin: true,
            allowedTabs: [
                'dashboard', 'orders', 'users', 'employees',
                'services', 'providers', 'tariffs',
                'marketing', 'promocodes', 'advocacy',
                'finance', 'support', 'kb',
                'projects', 'logs', 'security', 'settings'
            ]
        }
    });

    console.log(`Updated ${result.count} user records.`);

    // 2. Проверяем результат
    const users = await prisma.user.findMany({ where: { tgId } });
    users.forEach(u => {
        console.log(`User ID: ${u.id}, Role: ${u.role}, Global: ${u.isGlobalAdmin}, Tabs: ${u.allowedTabs.length}`);
    });
}

main().catch(console.error);
