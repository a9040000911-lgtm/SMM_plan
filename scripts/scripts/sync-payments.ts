/**
 * Ручной скрипт синхронизации платежей YooKassa.
 * Запуск: npx ts-node --compilerOptions '{"module":"CommonJS"}' scripts/sync-payments.ts
 */

async function main() {
    // Dynamic imports to avoid bundling issues
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        // Find all PENDING YooKassa transactions
        const pending = await prisma.transaction.findMany({
            where: {
                status: 'PENDING',
                provider: 'YOOKASSA',
                externalId: { not: null }
            },
            include: { order: { select: { id: true, status: true } } }
        });

        console.log(`[Sync] Found ${pending.length} pending YooKassa transactions`);

        if (pending.length === 0) {
            console.log('[Sync] Nothing to sync.');
            return;
        }

        for (const tx of pending) {
            console.log(`\n--- Transaction ${tx.id} ---`);
            console.log(`  Payment ID: ${tx.externalId}`);
            console.log(`  Amount: ${tx.amount}`);
            console.log(`  Created: ${tx.createdAt}`);

            // Check payment status via YooKassa API
            const axios = require('axios');

            // Get project payment settings
            const project = await prisma.project.findFirst({
                orderBy: { createdAt: 'asc' }
            });

            const settings = project?.paymentSettings as any;
            const shopId = settings?.testShopId || settings?.shopId;
            const secretKey = settings?.testSecretKey || settings?.secretKey;

            if (!shopId || !secretKey) {
                console.error('  ERROR: No YooKassa credentials found');
                continue;
            }

            const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

            try {
                const response = await axios.get(
                    `https://api.yookassa.ru/v3/payments/${tx.externalId}`,
                    {
                        headers: { Authorization: `Basic ${auth}` },
                        timeout: 10000
                    }
                );

                const status = response.data.status;
                console.log(`  YooKassa Status: ${status}`);

                if (status === 'succeeded') {
                    console.log(`  ✅ Payment SUCCEEDED! Confirming order...`);

                    // Update transaction
                    await prisma.transaction.update({
                        where: { id: tx.id },
                        data: { status: 'COMPLETED' }
                    });

                    // Credit user balance and process order
                    if (tx.userId) {
                        await prisma.user.update({
                            where: { id: tx.userId },
                            data: { balance: { increment: tx.amount } }
                        });
                        console.log(`  💰 Balance credited: +${tx.amount}₽`);
                    }

                    // If there's an associated order, mark it for processing
                    if (tx.order) {
                        await prisma.order.update({
                            where: { id: tx.order.id },
                            data: { status: 'PENDING' }
                        });
                        console.log(`  📦 Order ${tx.order.id} set to PENDING for processing`);
                    }
                } else if (status === 'canceled') {
                    console.log(`  ❌ Payment CANCELED`);
                    await prisma.transaction.update({
                        where: { id: tx.id },
                        data: { status: 'ERROR' }
                    });
                } else {
                    console.log(`  ⏳ Still ${status}, skipping...`);
                }
            } catch (apiErr: any) {
                console.error(`  API Error: ${apiErr.response?.data?.description || apiErr.message}`);
            }
        }
    } finally {
        await prisma.$disconnect();
        console.log('\n[Sync] Done.');
    }
}

main().catch(console.error);
