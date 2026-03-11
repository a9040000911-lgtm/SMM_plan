
import { PrismaClient } from '@prisma/client';
import { LoyaltyService } from '../src/services/users/loyalty.service';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 --- Loyalty Scheme Verification ---');

    // 1. Get Default Project
    const project = await prisma.project.findFirst({ where: { slug: 'default' } });
    if (!project) throw new Error('Default project not found');

    const originalConfig = project.config;
    console.log(`Original Config:`, JSON.stringify(originalConfig).substring(0, 50) + '...');

    const testCased = [
        { spend: 0, label: 'New User' },
        { spend: 4000, label: 'Small Spender' },
        { spend: 10000, label: 'Medium Spender' },
        { spend: 55000, label: 'High Spender' }
    ];

    // Create a dummy user for testing (or use one)
    const user = await prisma.user.create({
        data: {
            email: `test_loyalty_${Date.now()}@test.com`,
            projectId: project.id,
            balance: 1000,
            username: 'LoyaltyTester'
        }
    });

    try {
        const schemes = ['CLASSIC', 'GAMIFIED', 'VIP'];

        for (const scheme of schemes) {
            console.log(`\n🔄 Testing Scheme: ${scheme}`);

            // Update Project Config
            await prisma.project.update({
                where: { id: project.id },
                data: { config: { ...(originalConfig as any), loyaltyScheme: scheme } as any }
            });

            for (const test of testCased) {
                // Mock spent (passed directly to service, user record doesn't strictly adhere to it for calculation if we pass explicit amount? 
                // Wait, LoyaltyService.getLoyaltyInfo takes (userId, spentAmount, projectId). perfectly.
                const info = await LoyaltyService.getLoyaltyInfo(user.id, test.spend, project.id);
                console.log(`   [${test.label} | ${test.spend} RUB] -> Level: ${info.level.name} | Discount: ${info.loyaltyDiscount}%`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        // Restore Config
        console.log('\nRestoring configuration...');
        await prisma.project.update({
            where: { id: project.id },
            data: { config: originalConfig as any }
        });

        // Cleanup User
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.$disconnect();
    }
}

main();
