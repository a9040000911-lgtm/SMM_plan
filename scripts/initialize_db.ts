import { PrismaClient } from '../src/generated/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting database initialization...');

    try {
        // 1. Full cleanup (Truncate)
        console.log('🧹 Clearing Project and User tables...');
        await prisma.$executeRawUnsafe('TRUNCATE "Project", "User" CASCADE;');
        console.log('✅ Tables cleared successfully.');

        // 2. Create Project
        console.log('🏗️ Creating main project (smmplan.pro)...');
        const project = await prisma.project.create({
            data: {
                name: 'SMMplan',
                slug: 'main',
                domain: 'smmplan.pro',
                brandColor: '#3b82f6',
                isActive: true,
                maintenanceMode: false,
                updatedAt: new Date(),
            },
        });
        console.log(`✅ Project created: ${project.name} (${project.id})`);

        // 3. Create Admin User
        console.log('👤 Creating admin user...');
        const rawPassword = 'smmplan_admin_' + Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const admin = await prisma.user.create({
            data: {
                email: 'artem@smmplan.pro',
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
                isGlobalAdmin: true,
                projectId: project.id,
                balance: 10000.00,
                referralCode: crypto.randomUUID(),
                updatedAt: new Date(),
            },
        });

        console.log('\n✨ Database initialization completed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 Domain:   smmplan.pro');
        console.log('📧 Email:    ' + admin.email);
        console.log('👤 Username: ' + admin.username);
        console.log('🔑 Password: ' + rawPassword);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  SAVE THIS PASSWORD! It will not be shown again.\n');

    } catch (error) {
        console.error('❌ Error during initialization:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
