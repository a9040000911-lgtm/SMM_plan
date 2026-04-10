
import { prisma } from '../src/lib/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

async function updateKey() {
    const key = process.env.VEXBOOST_API_KEY;
    if (!key) {
        console.error('VEXBOOST_API_KEY not found in .env');
        return;
    }

    console.log(`Updating Vexboost API key to: ${key.substring(0, 5)}...`);

    const result = await prisma.provider.updateMany({
        where: { name: { contains: 'VexBoost', mode: 'insensitive' } },
        data: { apiKey: key }
    });

    console.log(`Updated ${result.count} providers.`);

    // Also check current balance to verify key works
    const provider = await prisma.provider.findFirst({ where: { name: { contains: 'VexBoost', mode: 'insensitive' } } });
    if (provider) {
        console.log(`API URL: ${provider.apiUrl}`);
    }
}

updateKey().catch(console.error).finally(() => prisma.$disconnect());
