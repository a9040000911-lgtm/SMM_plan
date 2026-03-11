
import { prisma } from '../src/lib/prisma';
import { initiateOrder, processPendingOrders } from '../src/services/orders/order-processor.service';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('🚀 Starting Full-Stack Order Test...');

    // 1. Get a random imported service
    const service = await prisma.internalService.findFirst({
        where: { id: { startsWith: 'vex_' }, isActive: true },
        include: { providerMappings: true }
    });

    if (!service) {
        console.error('❌ No imported services found. Run setup-vexboost-catalog.ts first.');
        return;
    }

    console.log(`📌 Using Service: ${service.name} (ID: ${service.id}, Price: ${service.pricePer1000})`);

    // 2. Get/Create a test Admin user
    let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) {
        console.log('Creating test admin...');
        user = await prisma.user.create({
            data: {
                username: 'admin_test',
                role: 'ADMIN',
                balance: new Decimal(1000)
            }
        });
    } else {
        await prisma.user.update({ where: { id: user.id }, data: { balance: { increment: 1000 } } });
    }

    const project = await prisma.project.findFirst();

    // 3. Initiate Order (DB + Balance)
    console.log('📝 Initiating order in local database...');
    const order = await initiateOrder({
        userId: user.id,
        serviceId: service.id,
        projectId: project?.id || null,
        link: 'https://t.me/smmMarket69/29',
        qty: 100,
        totalPrice: service.pricePer1000.mul(100).div(1000), // Simple math for test
        tgId: Number(user.tgId) || undefined,
        username: user.username || undefined
    });

    console.log(`✅ Order created in DB: ${order.id}. Status: ${order.status}`);

    // 4. Process Pending Orders (actually sends to provider)
    console.log('⚙️ Processing pending orders (sending to Vexboost)...');
    // Ensure we have some balance logs so the processor doesn't skip it
    const provider = await prisma.provider.findFirst({ where: { name: { contains: 'vexboost' } } });
    if (provider) {
        await prisma.providerBalanceLog.create({
            data: { providerId: provider.id, balance: new Decimal(20) }
        });
    }

    await processPendingOrders(order.id);

    // 5. Check result
    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
    console.log(`\n🏁 FINAL STATUS: ${finalOrder?.status}`);
    console.log(`🆔 External ID: ${finalOrder?.externalId}`);
    console.log(`🤖 Provider: ${finalOrder?.providerName}`);

    if (finalOrder?.status === 'PROCESSING') {
        console.log('\n🎉 SUCCESS! Order is now tracking in Smmplan database and sent to Vexboost.');
    } else {
        console.error('\n❌ Order processing failed. Check logs above.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
