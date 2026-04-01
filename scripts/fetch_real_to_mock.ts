import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import axios from 'axios';

const providers = [
    { id: 'soc-rocket', name: 'SocRocket', url: 'https://soc-rocket.ru/api/v2/', key: 'emrNjCPOuNMYKmMcxvHb532Xix99uAxM' },
    { id: 'smmprime', name: 'SMM Prime', url: 'https://smmprime.com/api/v2', key: '6833e1ceef531d34e7442d492b8e1021' },
    { id: 'stream-promotion', name: 'Stream Promotion', url: 'https://stream-promotion.ru/api/v2', key: 'fGOsh7PtBk3Ckyq3UmqH6HVNYTC2gGTH' },
    { id: 'likedrom', name: 'LikeDrom', url: 'https://likedrom.com/api/v2', key: '4f2aa7f20c56399b4790a4cd73f5b8c9' }, // Fixed /v2 for likedrom
    { id: 'smmpanelus', name: 'SMM Panel US', url: 'https://smmpanelus.com/api/v2', key: '48a6494eb16406d1226dce68f30d631d' },
    { id: 'soc-proof', name: 'SocProof', url: 'https://soc-proof.su/api/v2', key: 'a465d4013f1265153a2ca12bdd3cad06' },
    { id: 'telegram-shop', name: 'Telegram Shop', url: 'https://telegram.shop/api/v2', key: 'abcd6e54ff5b77a11dc8077074445e04' }
];

async function run() {
    const snapshotsDir = path.join(process.cwd(), 'src/app/api/dev/mock-provider/snapshots');
    if (!fs.existsSync(snapshotsDir)) {
        fs.mkdirSync(snapshotsDir, { recursive: true });
    }

    const mainProject = await prisma.project.findFirst();

    for (const prod of providers) {
        console.log(`\n⏳ Fetching catalog from ${prod.name} (${prod.url})...`);
        try {
            const res = await axios.post(prod.url, {
                action: 'services',
                key: prod.key
            }, {
               // Also send as form-data in case API is picky
               headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
               transformRequest: [(data) => new URLSearchParams(data).toString()]
            });

            if (res.data && Array.isArray(res.data)) {
                console.log(`✅ Loaded ${res.data.length} services from ${prod.name}`);
                const filePath = path.join(snapshotsDir, `${prod.id}-snapshot.json`);
                fs.writeFileSync(filePath, JSON.stringify(res.data, null, 2));

                // Upsert Provider to point to our local mock route
                const mockUrl = `http://127.0.0.1:3000/api/dev/mock-provider?mockName=${prod.id}`;
                await prisma.provider.upsert({
                    where: { name: `${prod.name} Mock` },
                    update: { apiUrl: mockUrl, isEnabled: true },
                    create: {
                        name: `${prod.name} Mock`,
                        apiUrl: mockUrl,
                        type: 'SMM_PANEL_V2',
                        isEnabled: true,
                        projectId: mainProject?.id || null,
                        apiKey: prod.key 
                    }
                });
                console.log(`✅ Mock provider "${prod.name} Mock" injected into DB.`);
            } else {
                console.error(`❌ Failed to load services from ${prod.name}: Invalid response format`, res.data);
            }
        } catch (error: any) {
            console.error(`❌ Fetch failed for ${prod.name}:`, error.message);
            if (error.response) console.error(error.response.data);
        }
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
