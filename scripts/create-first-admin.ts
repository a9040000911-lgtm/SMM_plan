import { PrismaClient, Role, Currency } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Initializing First Admin and Project ---');

    // 1. Создаем проект по умолчанию (если нет)
    let project = await prisma.project.findFirst({
        where: { slug: 'default' }
    });

    if (!project) {
        project = await prisma.project.create({
            data: {
                name: 'Default Project',
                slug: 'default',
                domain: 'smmplan.local',
                brandColor: '#3b82f6',
            }
        });
        console.log('Project created:', project.id);
    } else {
        console.log('Project already exists:', project.id);
    }

    // 2. Создаем администратора
    const email = 'art@artmspektr.ru';
    const hashedPassword = await bcrypt.hash('admin12345678', 10);

    const existingUser = await prisma.user.findFirst({
        where: { email }
    });

    if (!existingUser) {
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: Role.ADMIN,
                isGlobalAdmin: true,
                projectId: project.id,
                balance: 0,
                currency: Currency.RUB,
            }
        });
        console.log('Admin user created:', user.email);
        console.log('Default password: admin12345678');
        console.log('You can now use the reset password form or login with this password.');
    } else {
        console.log('User already exists:', existingUser.email);
        // Обновим роль на случай если он был просто USER
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                role: Role.ADMIN,
                isGlobalAdmin: true
            }
        });
        console.log('User permissions updated to ADMIN');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
