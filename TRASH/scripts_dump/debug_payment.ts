import { PrismaClient } from '@prisma/client';
import { PaymentService } from '../src/services/finance/payment.service';

const prisma = new PrismaClient();

async function main() {
    const targetId = '3115ac0b-000f-5000-8000-18579a6923f8';
    console.log(`🔍 Searching for ID: ${targetId}`);

    // 1. Search in Transactions
    const tx = await prisma.transaction.findFirst({
        where: {
            OR: [
                { id: targetId },
                { externalId: targetId }
            ]
        },
        include: { user: true }
    });

    if (tx) {
        console.log('✅ Found Transaction in DB:');
        console.log(JSON.stringify(tx, null, 2));
    } else {
        console.log('❌ Transaction NOT found in DB with this ID.');
    }

    // 2. Try to fetch status from YooKassa directly (if mapped)
    // Note: We need to see if we can use PaymentService here.
    try {
        console.log('🌐 Attempting to fetch status from Provider...');
        // This relies on your PaymentService implementation having a getStatus method public or similar
        // If not available, we skip.
    } catch (e) {
        console.log('Could not fetch from provider directly:', e);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
