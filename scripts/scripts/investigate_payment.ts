import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetId = '3115ac0b-000f-5000-8000-18579a6923f8';

    console.log(`🔍 Checking transaction metadata for: ${targetId}\n`);

    const tx = await prisma.transaction.findFirst({
        where: {
            OR: [
                { id: targetId },
                { externalId: targetId }
            ]
        },
        include: {
            user: {
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            paymentSettings: true
                        }
                    }
                }
            }
        }
    });

    if (!tx) {
        console.log('❌ Transaction not found');
        return;
    }

    console.log('📊 Transaction Details:');
    console.log(`   ID: ${tx.id}`);
    console.log(`   External ID: ${tx.externalId}`);
    console.log(`   Status: ${tx.status}`);
    console.log(`   Amount: ${tx.amount} ${tx.currency}`);
    console.log(`   Provider: ${tx.provider}`);
    console.log(`   Created: ${tx.createdAt}`);
    console.log(`\n📝 Metadata:`);
    console.log(JSON.stringify(tx.metadata, null, 2));

    console.log(`\n👤 User: ${tx.user.username} (${tx.user.email})`);
    console.log(`📂 Project: ${tx.user.project?.name || 'N/A'}`);

    console.log(`\n🔐 YooKassa Settings:`);
    const settings = tx.user.project?.paymentSettings as any;
    if (settings) {
        console.log(`   Mode: ${settings.mode || 'PRODUCTION'}`);
        console.log(`   Shop ID configured: ${!!settings.yookassaShopId || !!settings.shopId}`);
        console.log(`   Secret Key configured: ${!!settings.yookassaSecretKey || !!settings.secretKey}`);
        console.log(`   Test Shop ID configured: ${!!settings.testShopId}`);
        console.log(`   Test Secret Key configured: ${!!settings.testSecretKey}`);
    } else {
        console.log('   ❌ NO PAYMENT SETTINGS CONFIGURED');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
