import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const providers = [
    {
        id: 'socrocket',
        name: 'SocRocket',
        type: 'universal',
        apiUrl: 'https://soc-rocket.ru/api/v2/',
        apiKey: 'emrNjCPOuNMYKmMcxvHb532Xix99uAxM',
        isEnabled: true,
        metadata: { currency: 'RUB' }
    },
    {
        id: 'likedrom',
        name: 'Likedrom',
        type: 'universal',
        apiUrl: 'https://likedrom.com/api/v2',
        apiKey: 'DEMO_KEY',
        isEnabled: true,
        metadata: { currency: 'RUB' }
    },
    {
        id: 'smmpanelus',
        name: 'Smmpanel Us',
        type: 'universal',
        apiUrl: 'https://smmpanelus.com/api/v2',
        apiKey: 'DEMO_KEY',
        isEnabled: true,
        metadata: { requestType: 'json', method: 'POST', currency: 'USD' }
    },
    {
        id: 'partnersoc',
        name: 'Partner Soc',
        type: 'universal',
        apiUrl: 'https://partner.soc-rocket.ru/api/v2',
        apiKey: 'DEMO_KEY',
        isEnabled: true,
        metadata: { currency: 'RUB' }
    },
    {
        id: 'streampromotion',
        name: 'Stream Promotion',
        type: 'stream-promotion',
        apiUrl: 'https://stream-promotion.ru/api/v2',
        apiKey: 'DEMO_KEY',
        isEnabled: true,
        metadata: { currency: 'USD' }
    },
    {
        id: 'vexboost',
        name: 'VexBoost',
        type: 'vexboost',
        apiUrl: 'https://vexboost.com/api/v2',
        apiKey: 'DEMO_KEY',
        isEnabled: true,
        metadata: { currency: 'RUB' }
    },
    {
        id: 'smmprime',
        name: 'SmmPrime',
        type: 'universal',
        apiUrl: 'https://smmprime.com/api/v2',
        apiKey: 'DEMO_KEY',
        isEnabled: true,
        metadata: { currency: 'RUB' }
    },
    {
        id: 'karandash',
        name: 'Karandash',
        type: 'universal',
        apiUrl: 'https://karandash.ru/api/v2',
        apiKey: 'DEMO_KEY',
        isEnabled: true,
        metadata: { currency: 'RUB' }
    }
];

async function main() {
    console.log('--- ИНИЦИАЛИЗАЦИЯ ПРОВАЙДЕРОВ SMMTOOLBOX ---');
    for (const p of providers) {
        await prisma.provider.upsert({
            where: { id: p.id },
            update: {
                apiUrl: p.apiUrl,
                type: p.type,
                isEnabled: p.isEnabled,
                metadata: p.metadata as any
            },
            create: {
                id: p.id,
                name: p.name,
                type: p.type,
                apiUrl: p.apiUrl,
                apiKey: p.apiKey,
                isEnabled: p.isEnabled,
                balanceThreshold: 1000,
                metadata: p.metadata as any
            }
        });
        console.log(`✅ [${p.name}] добавлен.`);
    }
    console.log('--- ГОТОВО ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
