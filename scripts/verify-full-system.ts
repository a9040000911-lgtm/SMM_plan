import { PrismaClient } from '@prisma/client';
import { processPendingOrders } from '@/services/orders/order-processor.service';
import { TicketService } from '@/services/support/ticket.service';
import { Decimal } from 'decimal.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Full System Verification...");

    // --- SETUP ---
    const TEST_EMAIL = "test_sys_val@example.com";
    const TEST_PROVIDER = "TEST_SYS_PROV";
    const TEST_SERVICE_ID = "test-sys-svc-1";

    // Cleanup Previous Run
    await prisma.transaction.deleteMany({ where: { user: { email: TEST_EMAIL } } });
    await prisma.order.deleteMany({ where: { user: { email: TEST_EMAIL } } });
    await prisma.supportMessage.deleteMany({ where: { ticket: { user: { email: TEST_EMAIL } } } });
    await prisma.supportTicket.deleteMany({ where: { user: { email: TEST_EMAIL } } });
    await prisma.internalServiceMapping.deleteMany({ where: { internalServiceId: TEST_SERVICE_ID } });
    await prisma.internalService.deleteMany({ where: { id: TEST_SERVICE_ID } });
    await prisma.providerService.deleteMany({ where: { provider: { name: TEST_PROVIDER } } });
    await prisma.provider.deleteMany({ where: { name: TEST_PROVIDER } });
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

    console.log("✅ Cleanup complete.");

    // 1. Create User
    const user = await prisma.user.create({
        data: {
            email: TEST_EMAIL,
            username: "SysTester",
            balance: new Decimal(1000), // Rich user
            tgId: 123456789
        }
    });
    console.log(`👤 User Created: ${user.email} (Balance: ${user.balance})`);

    // 2. Create Provider & Service
    const provider = await prisma.provider.create({
        data: {
            name: TEST_PROVIDER,
            apiKey: "mock-api-key",
            apiUrl: "http://mock-provider.com/api/v2",
            isEnabled: true, // Fixed from isActive
            type: "SMM_PANEL"
        }
    });

    const providerService = await prisma.providerService.create({
        data: {
            providerId: provider.id,
            id: 101, // Changed to Int
            name: "Mock Likes",
            rawData: {},
            category: "LIKES",
            platform: "OTHER",
            rawPrice: new Decimal(10),
        }
    });

    const internalService = await prisma.internalService.create({
        data: {
            id: TEST_SERVICE_ID,
            category: "LIKES",
            platform: "OTHER",
            name: "System Test Likes",
            pricePer1000: new Decimal(20),
            description: "Test Attributes",
            minQty: 10,
            maxQty: 10000,
            geo: "Global"
        }
    });

    await prisma.internalServiceMapping.create({
        data: {
            internalServiceId: internalService.id,
            providerId: provider.id,
            providerServiceId: 101, // Changed to Int
            priority: 1
        }
    });

    console.log("🛠️ Provider & Service Created.");

    // 3. SCENARIO: Protection (Loss Leader)
    // User pays 5, Cost is 10. Should fail.

    console.log("\n🧪 TEST: Price Protection (Low Price Rejection)");
    const orderLowParams = {
        userId: user.id,
        serviceId: internalService.id,
        link: "http://test.com/post",
        qty: 1000,
        totalPrice: new Decimal(5),
        isManual: false
    };

    const orderLow = await prisma.order.create({
        data: {
            userId: user.id,
            internalServiceId: orderLowParams.serviceId,
            link: orderLowParams.link,
            quantity: orderLowParams.qty,
            totalPrice: orderLowParams.totalPrice,
            status: 'PENDING',
            costPrice: new Decimal(10)
        }
    });

    console.log(`   Order #${orderLow.id} Created (Price: 5, Cost: 10). Processing...`);

    // Create a Mock Balance Log
    await prisma.providerBalanceLog.create({
        data: { providerId: provider.id, balance: new Decimal(1000) }
    });

    await processPendingOrders(orderLow.id);

    const orderLowCheck = await prisma.order.findUnique({ where: { id: orderLow.id } });

    // Check for CANCELED status (Logic cancels/refunds rejected orders)
    if (orderLowCheck?.status === 'CANCELED') {
        console.log(`✅ PASSED: Order was rejected/refunded due to low price (Status: ${orderLowCheck.status}, Refunded: ${orderLowCheck.refundedAmount}).`);
    } else {
        console.error(`❌ FAILED: Order status is ${orderLowCheck?.status}`);
    }

    // 4. SCENARIO: Success
    console.log("\n🧪 TEST: Successful Order");
    const orderGood = await prisma.order.create({
        data: {
            userId: user.id,
            internalServiceId: internalService.id,
            link: "http://test.com/post2",
            quantity: 1000,
            totalPrice: new Decimal(20), // PROFITABLE
            status: 'PENDING',
            costPrice: new Decimal(10)
        }
    });

    await processPendingOrders(orderGood.id);
    console.log("   (Order created and logic executed)");
    console.log("   (In real env, this would call Provider API)");

    // 5. SCENARIO: Support
    console.log("\n🧪 TEST: Support Ticket");
    const ticket = await TicketService.getOrCreateTicket(user.id, "System Test Ticket");
    await TicketService.addMessage(ticket.id, 'USER', "Help me!");

    const ticketCheck = await prisma.supportTicket.findUnique({
        where: { id: ticket.id },
        include: { messages: true }
    });

    if (ticketCheck && ticketCheck.messages.length > 0) {
        console.log(`✅ PASSED: Ticket created with ${ticketCheck.messages.length} messages.`);
    } else {
        console.error("❌ FAILED: Ticket creation failed.");
    }

    console.log("\n✨ Verification Complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
