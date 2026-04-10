
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('--- STARTING INITIAL TEST SEEDING (V7.3) ---');

    // 1. Create Project
    const project = await prisma.project.upsert({
        where: { slug: '101' },
        update: {
            domain: 'localhost',
            name: 'Test Project 101'
        },
        create: {
            slug: '101',
            domain: 'localhost',
            name: 'Test Project 101',
            brandColor: '#3b82f6',
        }
    });
    console.log(`✅ Project ready: ${project.slug} (ID: ${project.id})`);

    // 2. Create Admin User
    const email = 'admin@test.com';
    const password = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.upsert({
        where: {
            email: email
        },
        update: {
            role: 'ADMIN',
            isGlobalAdmin: true,
            balance: 1000.00
        },
        create: {
            projectId: project.id,
            email: email,
            username: 'admin',
            password: password,
            role: 'ADMIN',
            isGlobalAdmin: true,
            balance: 1000.00,
        }
    });
    console.log(`✅ Admin user created: ${email}`);

    // 3. Create Provider
    const provider = await prisma.provider.upsert({
        where: { id: 'test-provider' },
        update: {},
        create: {
            id: 'test-provider',
            name: 'Test Provider',
            apiUrl: 'https://api.testprovider.com',
            apiKey: 'test-api-key',
            type: 'universal',
            isEnabled: true,
        }
    });
    console.log(`✅ Provider created: ${provider.name}`);

    // 4. Service Group removed (Legacy)

    // 5. Create Internal Service
    const internalService = await prisma.internalService.upsert({
        where: { id: 'test-svc-001' },
        update: {},
        create: {
            id: 'test-svc-001',
            name: 'Test Followers',
            platform: 'INSTAGRAM',
            category: 'SUBSCRIBERS', // Fix: SUBSCRIBERS
            description: 'Test followers service',
            minQty: 10,
            maxQty: 1000,
            pricePer1000: 0.5,
            lastProviderPrice: 0.5,
            geo: 'WORLDWIDE',
            isActive: true,
        }
    });
    console.log(`✅ Internal Service created: ${internalService.name}`);

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
