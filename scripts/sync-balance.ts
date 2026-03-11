const { PrismaClient } = require('../src/generated/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const axios = require('axios');
require('dotenv').config();

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const pending = await prisma.transaction.findMany({
            where: {
                status: 'PENDING',
                provider: 'YOOKASSA',
                externalId: { not: null }
            },
            include: { user: true }
        });

        console.log(`[Sync] Found ${pending.length} pending transactions`);

        const project = await prisma.project.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        const settings = project?.paymentSettings;
        const shopId = settings?.yookassaShopId || process.env.YOOKASSA_SHOP_ID;
        const secretKey = settings?.yookassaSecretKey || process.env.YOOKASSA_SECRET_KEY;

        if (!shopId || !secretKey) {
            console.error('Credentials missing');
            return;
        }

        const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

        for (const tx of pending) {
            console.log(`Checking ${tx.externalId}...`);
            try {
                const response = await axios.get(`https://api.yookassa.ru/v3/payments/${tx.externalId}`, {
                    headers: { Authorization: `Basic ${auth}` }
                });

                if (response.data.status === 'succeeded') {
                    console.log(`✅ Success for ${tx.id}. Crediting balance...`);
                    await prisma.$transaction([
                        prisma.user.update({
                            where: { id: tx.userId },
                            data: { balance: { increment: tx.amount } }
                        }),
                        prisma.transaction.update({
                            where: { id: tx.id },
                            data: { status: 'COMPLETED' }
                        })
                    ]);
                } else {
                    console.log(`Status: ${response.data.status}`);
                }
            } catch (err) {
                console.error(`Error checking ${tx.id}:`, err.message);
            }
        }
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main().catch(console.error);
