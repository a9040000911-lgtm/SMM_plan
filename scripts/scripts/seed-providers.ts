import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Add SocRocket
    await prisma.provider.upsert({
        where: { id: 'socrocket' },
        update: {},
        create: {
            id: 'socrocket',
            name: 'SocRocket',
            type: 'universal',
            apiUrl: 'https://soc-rocket.ru/api/v2/',
            apiKey: 'emrNjCPOuNMYKmMcxvHb532Xix99uAxM',
            isEnabled: true,
            balanceThreshold: 1000,
            metadata: {
                currency: 'RUB'
            }
        }
    });

    // Add VexBoost (optional but good for completeness)
    await prisma.provider.upsert({
        where: { id: 'vexboost' },
        update: {},
        create: {
            id: 'vexboost',
            name: 'VexBoost',
            type: 'vexboost',
            apiUrl: 'https://vexboost.com/api/v2',
            apiKey: 'test-key',
            isEnabled: false,
            balanceThreshold: 1000
        }
    });

    console.log('Providers seeded.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
