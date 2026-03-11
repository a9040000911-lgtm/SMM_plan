import { PrismaClient } from '@/generated/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating admin user...\n');

    // Генерируем безопасный пароль
    const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем проект если его нет
    const project = await prisma.project.upsert({
        where: { slug: 'main-project' },
        update: {},
        create: {
            name: 'Main Project',
            slug: 'main-project',
            domain: 'localhost:3000',
            brandColor: '#3b82f6',
            maintenanceMode: false,
        },
    });

    console.log('✅ Project:', project.name);

    // Создаем админа
    const admin = await prisma.user.create({
        data: {
            email: 'art@artmspektr.ru',
            username: 'artadmin',
            password: hashedPassword,
            role: 'ADMIN',
            isGlobalAdmin: true,
            projectId: project.id,
            balance: 10000.00, // Начальный баланс для тестирования
        },
    });

    console.log('\n✅ Администратор успешно создан!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', admin.email);
    console.log('👤 Username: ', admin.username);
    console.log('🔑 Password: ', password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  ВАЖНО: Сохраните пароль! Он показан только один раз.\n');
}

main()
    .catch((e) => {
        console.error('❌ Ошибка:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

