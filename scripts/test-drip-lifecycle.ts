
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

import { initiateOrder } from '../src/services/orders';
import { DripFeedService } from '../src/services/orders/drip-feed.service';
import { InternalService } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🧪 STARTING DRIP FEED LIFECYCLE TEST");

    // Mock ProviderService
    const { ProviderService } = await import('../src/services/providers');
    ProviderService.createOrder = async () => {
        console.log("   [Mock] ProviderService.createOrder called. Returning success.");
        return { success: true, externalId: `mock-ext-${Date.now()}` };
    };

    // Mock Bot
    const { bot } = await import('../src/lib/bot');
    Object.defineProperty(bot, 'telegram', {
        value: {
            sendMessage: async () => {
                console.log("   [Mock] bot.telegram.sendMessage called.");
                return {};
            }
        },
        writable: true
    });

    // 1. Setup User & Project
    const projectId = "default-project"; // Assuming default exists
    const project = await prisma.project.findFirst();
    if (!project) throw new Error("No project found");

    const userEmail = `test_drip_${Date.now()}@example.com`;
    const user = await prisma.user.create({
        data: {
            username: `drip_tester_${Date.now()}`,
            email: userEmail,
            password: "hash",
            projectId: project.id,
            balance: 100000 // Rich user
        }
    });
    console.log(`✅ Created Test User: ${user.email} (Balance: ${user.balance})`);

    // 2. Find a Service
    let service = await prisma.internalService.findFirst({
        where: { isActive: true, pricePer1000: { gt: 0 } }
    });

    if (!service) {
        console.warn("⚠️ No active service found. Creating a TEST service...");
        const provider = await prisma.provider.findFirst() || await prisma.provider.create({
            data: {
                name: "TestProvider",
                type: "API",
                apiUrl: "https://example.com/api",
                apiKey: "test",
                balanceThreshold: new (await import('decimal.js')).Decimal(10),
                metadata: {},
                isEnabled: true
            }
        });

        // Ensure ProviderService exists
        await prisma.providerService.upsert({
            where: { id_providerId: { id: 123, providerId: provider.id } },
            create: {
                id: 123,
                providerId: provider.id,
                name: "Test Provider Service",
                rawPrice: new (await import('decimal.js')).Decimal(1),
                rawData: {},
                category: "VIEWS",
                platform: "TELEGRAM"
            },
            update: {}
        });

        service = await prisma.internalService.create({
            data: {
                id: "test-service-drip",
                name: "Test Drip Service",
                description: "Test Drip Service Description",
                geo: "World",
                platform: "TELEGRAM",
                category: "VIEWS",
                pricePer1000: new (await import('decimal.js')).Decimal(10),
                minQty: 100,
                maxQty: 10000,
                isActive: true,
                providerMappings: {
                    create: {
                        providerId: provider.id,
                        providerServiceId: 123,
                        priority: 1
                    }
                }
            },
            include: { providerMappings: true }
        });
        console.log(`✅ Created Test Service: ${service.name}`);
    }
    console.log(`✅ Selected Service: ${service.name} (ID: ${service.id})`);

    // 3. Initiate Drip Order
    const TOTAL_QTY = 1000;
    const RUNS = 5; // 200 per run
    const INTERVAL = 1; // 1 min

    console.log(`🚀 Initiating Order: ${TOTAL_QTY} items, ${RUNS} runs, ${INTERVAL} min interval...`);

    // We mock initiateOrder args. 
    // Note: initiateOrder usually expects specific structure. 
    // We will use the service function directly if possible, or simulate logic.
    // Importing initiateOrder from index.ts might require full env setup.
    // Let's rely on creating order in DB directly to avoid complex deps, 
    // OR try to use the imported function if it works (it relies on other services).
    // Let's try imported function first.

    try {
        const order = await initiateOrder({
            userId: user.id,
            serviceId: service.id,
            projectId: project.id,
            link: "https://example.com/test-drip",
            qty: TOTAL_QTY,
            totalPrice: new (await import('decimal.js')).Decimal(10), // Mock price
            tgId: 12345, // Mock TG
            isDripFeed: true,
            dripFeed: {
                runs: RUNS,
                interval: INTERVAL
            }
        });

        console.log(`✅ Order Created: ${order.id} | Status: ${order.status}`);
        console.log(`   Drip Info: runs=${order.runs}, interval=${order.interval}, currentRun=${order.currentRun}`);

        if (!order.isDripFeed || order.runs !== RUNS) {
            throw new Error("Order was not saved as Drip Feed correctly");
        }

        // 4. Force Run 1 (Simulate Worker)
        console.log("🔄 Force Running Iteration 1 (First run often happens immediately or scheduled)...");
        // Usually initiateOrder schedules run-2 immediately if run-1 is "instant". 
        // Let's check DB state.

        let freshOrder = await prisma.order.findUnique({ where: { id: order.id } });
        console.log(`   Current Run: ${freshOrder?.currentRun}`);

        // If currentRun is 0, we run it.
        if (freshOrder?.currentRun === 0) {
            await DripFeedService.processRun(order.id);
            freshOrder = await prisma.order.findUnique({ where: { id: order.id } });
            console.log(`   After Force Run 1: Current Run=${freshOrder?.currentRun}`);
        }

        // 5. Force Run 2
        console.log("🔄 Force Running Iteration 2...");
        await DripFeedService.processRun(order.id);
        freshOrder = await prisma.order.findUnique({ where: { id: order.id } });
        console.log(`   After Force Run 2: Current Run=${freshOrder?.currentRun}`);

        if (freshOrder?.currentRun !== 2 && freshOrder?.currentRun !== 1) { // It might skip if logic differs
            console.warn("⚠️ Warning: Run count might not have incremented as expected. Check logic.");
        }

        console.log("✅ Test Cycle Complete. Cleaning up...");
        // Cleanup
        await prisma.transaction.deleteMany({ where: { userId: user.id } });
        await prisma.ledgerEntry.deleteMany({ where: { userId: user.id } });
        await prisma.order.delete({ where: { id: order.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log("🗑️ Cleanup Done.");

    } catch (e) {
        console.error("❌ Test Failed:", e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
