import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetId = '3115ac0b-000f-5000-8000-18579a6923f8';

    console.log(`🔧 Updating transaction ${targetId} to FAILED status...`);

    const updated = await prisma.transaction.update({
        where: { externalId: targetId },
        data: {
            status: 'ERROR',
            metadata: {
                error: 'Payment creation failed at YooKassa',
                failedAt: new Date().toISOString(),
                note: 'Manually fixed - transaction was stuck in PENDING'
            }
        }
    });

    console.log('✅ Transaction updated successfully:');
    console.log(JSON.stringify(updated, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
