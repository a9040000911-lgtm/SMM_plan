import { PrismaClient, Role, Decimal } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
import { ServiceSyncService } from '../src/services/providers/sync.service';

dotenv.config();
process.env.ALLOW_LOCAL_MOCKS = 'true';
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Admin Recovery & Seeding...');

    // 1. Ensure Project exists
    let project = await prisma.project.findFirst();
    if (!project) {
        console.log('Creating default project...');
        project = await prisma.project.create({
            data: {
                name: 'Smmplan Main',
                slug: 'main',
                domain: 'localhost',
            }
        });
    }
    console.log(`Using Project: ${project.name} (${project.id})`);

    // 2. Create Admin (CRITICAL: DO FIRST)
    console.log('Step 2: Creating/Updating admin art@artmspektr.ru...');
    const rawPassword = process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const existingAdmin = await prisma.user.findFirst({
        where: { email: 'art@artmspektr.ru' }
    });

    if (existingAdmin) {
        await prisma.user.update({
            where: { id: existingAdmin.id },
            data: {
                role: 'ADMIN' as Role,
                isGlobalAdmin: true,
                password: hashedPassword,
                projectId: project.id,
                twoFactorEnabled: false,
            }
        });
    } else {
        await prisma.user.create({
            data: {
                email: 'art@artmspektr.ru',
                username: 'Artem',
                role: 'ADMIN' as Role,
                isGlobalAdmin: true,
                projectId: project.id,
                balance: new Decimal(1000000),
                password: hashedPassword,
                twoFactorEnabled: false
            }
        });
    }
    console.log('✅ Admin configured access!');

    // 3. Ensure Providers exist
    console.log('Step 3: Checking for providers...');
    let vexboost = await prisma.provider.findFirst({ where: { name: 'Vexboost' } });
    if (!vexboost) {
        vexboost = await prisma.provider.create({
            data: {
                name: 'Vexboost',
                apiUrl: 'https://vexboost.com/api/v2',
                apiKey: process.env.VEXBOOST_API_KEY || 'MISSING',
                isEnabled: true,
                pricesCurrency: 'RUB',
                balanceCurrency: 'RUB',
                projectId: project.id
            }
        });
    }

    // 4. Trigger sync (Non-fatal)
    console.log('Step 4: Syncing services (this might fail due to timeout)...');
    try {
        await ServiceSyncService.syncAllServices();
        console.log('✅ Sync finished');
    } catch (e) {
        console.warn('⚠️ Sync failed, but admin is already created:', e instanceof Error ? e.message : e);
    }

    console.log('-------------------------------------------');
    console.log('✅ RECOVERY COMPLETE!');
    console.log('You can now log in at /admin');
    console.log('Email: art@artmspektr.ru');
    console.log(`Password: ${rawPassword}`);
    console.log('-------------------------------------------');
}

main()
    .catch(e => {
        console.error('❌ Script failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
