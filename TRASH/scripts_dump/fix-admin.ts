import { PrismaClient } from '../src/generated/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = 'art@artmspektr.ru';
    const password = 'admin123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Создаем или находим основной проект
    const defaultProject = await prisma.project.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
            name: 'Main Project',
            slug: 'default',
            domain: 'localhost',
            brandColor: '#3b82f6',
        }
    });

    console.log('✅ Project "default" ready');

    // 2. Исправляем пользователя ГЛОБАЛЬНО
    const user = await prisma.user.upsert({
        where: { email: email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            isGlobalAdmin: true,
            username: 'artadmin',
            projectId: defaultProject.id
        },
        create: {
            email: email,
            password: hashedPassword,
            role: 'ADMIN',
            isGlobalAdmin: true,
            username: 'artadmin',
            projectId: defaultProject.id
        }
    });

    console.log('✅ Пользователь обновлен ГЛОБАЛЬНО');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password:', password);

}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
