import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst({
        where: { name: 'SMM_plan' },
        select: {
            id: true,
            name: true,
            paymentSettings: true
        }
    });

    if (!project) {
        console.log('❌ Project not found');
        return;
    }

    console.log(`📂 Project: ${project.name}`);
    console.log(`🔐 Current Payment Settings:`);
    console.log(JSON.stringify(project.paymentSettings, null, 2));

    console.log(`\n\n💡 To fix payment issues, you need to configure YooKassa credentials in Admin Panel:`);
    console.log(`   1. Go to: http://localhost:3000/admin/settings`);
    console.log(`   2. Navigate to "Finance" tab`);
    console.log(`   3. Enter YooKassa credentials:`);
    console.log(`      - Shop ID (from YooKassa dashboard)`);
    console.log(`      - Secret Key (from YooKassa API settings)`);
    console.log(`   4. Save settings`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
