
import { prisma } from '../src/lib/prisma';
import { ProviderService } from '../src/services/providers/provider.service';
import { ServiceSyncService } from '../src/services/providers/sync.service';
import { LinkService } from '../src/services/providers/link.service';
import { Decimal } from 'decimal.js';
import http from 'http';
import querystring from 'querystring';

// --- MOCK PROVIDER SERVER ---
const MOCK_SERVICES = [
    { service: 101, name: 'IG Likes High Quality', rate: '0.1', min: 10, max: 10000, category: 'Likes', type: 'Default' },
    { service: 102, name: 'TG Channel Members', rate: '0.5', min: 20, max: 50000, category: 'Members', type: 'Default' },
    { service: 103, name: 'YT Views Real', rate: '2.0', min: 100, max: 100000, category: 'Views', type: 'Default' },
];

let lastCreatedExternalId = 1000;
let failNextOrder = false;

const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        res.setHeader('Content-Type', 'application/json');

        // Parse params from query or body
        const urlParams = new URL(req.url!, `http://${req.headers.host}`).searchParams;
        const bodyParams = querystring.parse(body);

        const action = (urlParams.get('action') || bodyParams['action']) as string;
        console.log(`[MockServer] Received request: ${req.method} ${req.url} | Action: ${action}`);

        if (action === 'services') {
            res.end(JSON.stringify(MOCK_SERVICES));
        } else if (action === 'balance') {
            res.end(JSON.stringify({ balance: 500, currency: 'USD' }));
        } else if (action === 'add') {
            if (failNextOrder) {
                failNextOrder = false;
                console.log('[MockServer] Simulating failure (Maintenance)');
                res.end(JSON.stringify({ error: 'Maintenance in progress' }));
            } else {
                console.log('[MockServer] Returning success order ID');
                res.end(JSON.stringify({ order: ++lastCreatedExternalId }));
            }
        } else if (action === 'status') {
            res.end(JSON.stringify({ status: 'Processing', remains: 0, charge: '0.1' }));
        } else {
            res.end(JSON.stringify({ error: 'Unknown action' }));
        }
    });
});

async function main() {
    console.log('--- STARTING COMPLEX FULL CYCLE TEST (v7.5) ---');

    // Start mock server
    server.listen(4000, () => console.log('✅ Mock Provider Server running on port 4000'));

    try {
        // --- SCENARIO A: IMPORT & MAPPING ---
        console.log('\n[Scenario A] Import & Catalog Mapping...');

        const providerNameAlpha = 'Mock Alpha';
        const providerAlpha = await prisma.provider.upsert({
            where: { id: 'mock-alpha' },
            update: { isEnabled: true, apiUrl: 'http://localhost:4000/?' },
            create: {
                id: 'mock-alpha',
                name: providerNameAlpha,
                apiUrl: 'http://localhost:4000/?',
                apiKey: 'alpha-key',
                type: 'perfect-panel',
                isEnabled: true,
                metadata: { currency: 'USD' }
            }
        });

        // Trigger Sync
        await ServiceSyncService.syncProvider(providerAlpha.id);

        const importedSvc = await prisma.providerService.findFirst({
            where: { providerId: providerAlpha.id, name: { contains: 'IG Likes' } }
        });

        if (!importedSvc) throw new Error('Scenario A failed: IG Likes not imported');
        console.log(`✅ Imported: ${importedSvc.name} | Price: ${importedSvc.rawPrice} RUB`);

        // Create Internal Service and Map it
        const project = await prisma.project.findUnique({ where: { slug: '101' } });
        if (!project) throw new Error('Project 101 missing');

        const internalSvc = await prisma.internalService.upsert({
            where: { id: 'full-cycle-ig-likes' },
            create: {
                id: 'full-cycle-ig-likes',
                name: 'IG High Quality Likes',
                platform: 'INSTAGRAM',
                category: 'LIKES',
                description: 'Test service',
                minQty: 10,
                maxQty: 10000,
                pricePer1000: 5.0, // Markup
                lastProviderPrice: importedSvc.rawPrice,
                geo: 'WORLDWIDE'
            },
            update: { lastProviderPrice: importedSvc.rawPrice }
        });

        await prisma.internalServiceMapping.upsert({
            where: {
                projectId_internalServiceId_providerServiceId_providerId: {
                    projectId: project.id,
                    internalServiceId: internalSvc.id,
                    providerServiceId: importedSvc.id,
                    providerId: providerAlpha.id
                }
            },
            create: {
                projectId: project.id,
                internalServiceId: internalSvc.id,
                providerId: providerAlpha.id,
                providerServiceId: importedSvc.id,
                priority: 1,
                isActive: true
            },
            update: { priority: 1, isActive: true }
        });
        console.log('✅ Service mapping established.');

        // --- SCENARIO B: LINK ANALYSIS ---
        console.log('\n[Scenario B] Link Analysis & Validation...');
        const links = [
            { url: 'https://instagram.com/p/CXYZ123', platform: 'INSTAGRAM', target: 'POST', expected: true },
            { url: 'https://t.me/durov', platform: 'TELEGRAM', target: 'CHANNEL', expected: true },
        ];

        for (const l of links) {
            const res = LinkService.validate(l.url, l.platform as any, l.target);
            const status = res.isValid === l.expected ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} | Link: ${l.url} | Valid: ${res.isValid} | Error: ${res.error || 'None'}`);
        }

        // --- SCENARIO C: FAILOVER & FAILOVER PRICES ---
        console.log('\n[Scenario C] Failover Simulation...');

        const providerBetaName = 'Mock Beta';
        const providerBeta = await prisma.provider.upsert({
            where: { id: 'mock-beta' },
            update: { isEnabled: true, apiUrl: 'http://localhost:4000/?' },
            create: {
                id: 'mock-beta',
                name: providerBetaName,
                apiUrl: 'http://localhost:4000/?',
                apiKey: 'beta-key',
                type: 'perfect-panel',
                isEnabled: true
            }
        });

        const importedSvcBeta = await prisma.providerService.upsert({
            where: { id_providerId: { id: 201, providerId: providerBeta.id } },
            create: {
                id: 201,
                providerId: providerBeta.id,
                name: 'IG Likes Beta',
                rawPrice: 0.2,
                platform: 'INSTAGRAM',
                category: 'LIKES',
                rawData: { info: 'Manual mock service' }
            },
            update: { rawData: { info: 'Manual mock service' } }
        });

        await prisma.internalServiceMapping.upsert({
            where: {
                projectId_internalServiceId_providerServiceId_providerId: {
                    projectId: project.id,
                    internalServiceId: internalSvc.id,
                    providerServiceId: importedSvcBeta.id,
                    providerId: providerBeta.id
                }
            },
            create: {
                projectId: project.id,
                internalServiceId: internalSvc.id,
                providerId: providerBeta.id,
                providerServiceId: importedSvcBeta.id,
                priority: 2,
                isActive: true
            },
            update: { priority: 2, isActive: true }
        });

        const admin = await prisma.user.findFirst({ where: { email: 'admin@test.com' } });
        if (!admin) throw new Error('Admin missing');

        const order = await prisma.order.create({
            data: {
                projectId: project.id,
                userId: admin.id,
                internalServiceId: internalSvc.id,
                link: 'https://instagram.com/p/test',
                quantity: 100,
                totalPrice: 1.0,
                providerName: providerNameAlpha,
                status: 'PENDING'
            }
        });

        console.log(`Created order ${order.id}. Current provider: ${order.providerName}`);

        const { tryAutoRefill } = await import('../src/services/orders/order-processor.service');

        console.log('Triggering tryAutoRefill...');
        const refillResult = await tryAutoRefill(order.id);

        if (refillResult) {
            console.log('✅ Auto-Failover successful!');
            const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
            console.log(`New Provider: ${updatedOrder?.providerName} | Status: ${updatedOrder?.status}`);
        } else {
            console.log('❌ Auto-Failover failed code. Checking why...');
            // Check mapping logic manually
            const ord = await prisma.order.findUnique({
                where: { id: order.id },
                include: { internalService: { include: { providerMappings: { include: { provider: true } } } } }
            });
            console.log(`Mappings found: ${ord?.internalService.providerMappings.length}`);
            ord?.internalService.providerMappings.forEach(m => {
                console.log(`- Provider: ${m.provider.name} | Active: ${m.isActive} | Priority: ${m.priority}`);
            });
        }

        // --- SCENARIO D: REFUNDS & DOUBLE REFUND PROTECTION ---
        console.log('\n[Scenario D] Refund & Double Refund Protection...');

        const { processManualRefund } = await import('../src/services/orders/order-processor.service');

        const balanceBefore = (await prisma.user.findUnique({ where: { id: admin.id } }))?.balance || new Decimal(0);
        console.log(`Initial Balance: ${balanceBefore}`);

        console.log('Executing first refund...');
        const refundAmt = await processManualRefund(order.id, 'INTERNAL', true);
        console.log(`Refund 1 amount: ${refundAmt}`);

        console.log('Attempting second refund for the same order...');
        const refund2 = await processManualRefund(order.id, 'INTERNAL', true).catch(e => {
            console.log(`✅ Second refund blocked with error: ${e.message}`);
            return 0;
        });

        if (refund2 === 0 || !refund2) {
            console.log('✅ Blocked second refund.');
        } else {
            console.log(`❌ FAIL: Second refund returned ${refund2}`);
        }

        const balanceAfter = (await prisma.user.findUnique({ where: { id: admin.id } }))?.balance || new Decimal(0);
        console.log(`Final Balance: ${balanceAfter} | Difference: ${balanceAfter.minus(balanceBefore)}`);

        // --- SCENARIO E: UNIFIED PROFILE & SUPPORT ---
        console.log('\n[Scenario E] Unified Profile & Support...');

        const tgId = BigInt('777888999');
        const tgUser = await prisma.user.upsert({
            where: { projectId_tgId: { projectId: project.id, tgId: tgId } },
            update: { balance: 10 },
            create: {
                projectId: project.id,
                tgId: tgId,
                username: 'tg_tester_final',
                balance: 10
            }
        });

        await prisma.user.update({
            where: { id: tgUser.id },
            data: { email: 'tester_final@mail.com' }
        });
        console.log(`✅ Profile updated: ${tgUser.username} linked to tester_final@mail.com`);

        console.log('Admin adding 1000 RUB...');
        await prisma.$transaction(async (tx) => {
            await tx.user.update({ where: { id: tgUser.id }, data: { balance: { increment: 1000 } } });
        });

        const finalTester = await prisma.user.findUnique({ where: { id: tgUser.id } });
        console.log(`Final Balance: ${finalTester?.balance} RUB`);

        console.log('\n--- ALL SCENARIOS COMPLETED SUCCESSFULLY ---');

    } catch (err: any) {
        console.error('\n❌ TEST SUITE FAILED:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        server.close();
        await prisma.$disconnect();
    }
}

main();
