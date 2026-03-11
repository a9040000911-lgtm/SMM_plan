
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Decimal = require('decimal.js');

async function syncDirect() {
    const providerId = '70261160-8d2b-4395-9087-b054ce274406'; // PanelUS
    const apiUrl = 'https://smmpanelus.com/api/v2';
    const apiKey = 'f51b6f1ffc6a3da808ddb868905fea4a';

    console.log(`Starting direct sync for PanelUS via fetch...`);

    const params = new URLSearchParams();
    params.append('key', apiKey);
    params.append('action', 'services');

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: params,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const services = await response.json();
        console.log(`Received ${services.length} services.`);

        // Пакетная запись (upsert)
        const CHUNK_SIZE = 50;
        for (let i = 0; i < services.length; i += CHUNK_SIZE) {
            const chunk = services.slice(i, i + CHUNK_SIZE);
            await prisma.$transaction(
                chunk.map(s => prisma.providerService.upsert({
                    where: { id_providerId: { id: Number(s.service), providerId: providerId } },
                    update: {
                        name: s.name,
                        rawPrice: new Decimal(s.rate || 0).mul(90),
                        platform: 'OTHER',
                        category: 'OTHER',
                        rawData: s,
                        lastUpdated: new Date()
                    },
                    create: {
                        id: Number(s.service),
                        providerId: providerId,
                        name: s.name,
                        rawPrice: new Decimal(s.rate || 0).mul(90),
                        platform: 'OTHER',
                        category: 'OTHER',
                        rawData: s,
                        lastUpdated: new Date()
                    }
                }))
            );
            if (i % 500 === 0) console.log(`Processed ${i} items...`);
        }

        console.log(`Successfully synced ${services.length} services for PanelUS!`);
    } catch (err) {
        console.error('Direct sync failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

syncDirect();
