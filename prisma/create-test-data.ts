import { PrismaClient } from '@/generated/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating test data...');

    // Create test project
    const project = await prisma.project.upsert({
        where: { slug: 'test-project' },
        update: {},
        create: {
            name: 'Test Project',
            slug: 'test-project',
            domain: 'localhost:3001',
        },
    });

    console.log('✅ Created project:', project.name);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { id: 'admin-user' },
        update: {},
        create: {
            id: 'admin-user',
            username: 'admin',
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'ADMIN',
            isGlobalAdmin: true,
            projectId: project.id,
            balance: 1000.00,
        },
    });

    console.log('✅ Created admin user:', admin.username);
    console.log('   Email:', admin.email);
    console.log('   Password: admin123');

    console.log('\n✅ Test data created successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

