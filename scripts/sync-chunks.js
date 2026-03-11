
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const Decimal = require('decimal.js');

async function syncChunks() {
    const providerId = '70261160-8d2b-4395-9087-b054ce274406'; // PanelUS
    const data = JSON.parse(fs.readFileSync('services.json', 'utf8'));
    console.log(`Total services to sync: ${data.length}`);

    const CHUNK_SIZE = 100;
    let synced = 0;

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        console.log(`Syncing chunk ${i / CHUNK_SIZE + 1} (${chunk.length} items)...`);

        try {
            await prisma.$transaction(
                chunk.map(s => {
                    const rawPrice = new Decimal(s.rate || 0);
                    // Mock analysis or just use basic
                    return prisma.providerService.upsert({
                        where: { id_providerId: { id: Number(s.service), providerId: providerId } },
                        update: {
                            name: s.name,
                            rawPrice: rawPrice.mul(90), // Assume RUB rate for now
                            platform: 'OTHER',
                            category: 'OTHER',
                            rawData: s,
                            lastUpdated: new Date()
                        },
                        create: {
                            id: Number(s.service),
                            providerId: providerId,
                            name: s.name,
                            rawPrice: rawPrice.mul(90),
                            platform: 'OTHER',
                            category: 'OTHER',
                            rawData: s,
                            lastUpdated: new Date()
                        }
                    });
                })
            );
            synced += chunk.length;
        } catch (err) {
            console.error(`Failed chunk starting at ${i}:`, err.message);
        }
    }

    console.log(`Finished. Synced ${synced} services.`);
}

syncChunks().catch(console.error).finally(() => prisma.$disconnect());
