
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { initiateOrder, processPendingOrders } from '../src/services/orders/order-processor.service';
import { Decimal } from 'decimal.js';
import { Role } from '@prisma/client';

async function main() {
    console.log('--- TEST: Real Order from Admin ---');

    // 1. Setup Admin User
    const adminTgId = process.env.ADMIN_TG_ID || '268747191';
    const project = await prisma.project.findFirst();
    if (!project) throw new Error('No project found');

    const admin = await prisma.user.upsert({
        where: { projectId_email: { projectId: project.id, email: 'admin@smmplan.ru' } },
        update: {
            role: 'ADMIN' as Role,
            balance: new Decimal(1000),
            tgId: BigInt(adminTgId),
            username: 'admin_test'
        },
        create: {
            email: 'admin@smmplan.ru',
            username: 'admin_test',
            balance: new Decimal(1000),
            role: 'ADMIN' as Role,
            projectId: project.id,
            tgId: BigInt(adminTgId)
        }
    });
    console.log(`Admin User: ${admin.email} (TG: ${admin.tgId})`);

    // 2. Select a Service mapped to VexBoost
    const service = await prisma.internalService.findFirst({
        where: {
            platform: 'TELEGRAM',
            isActive: true,
            providerMappings: {
                some: {
                    provider: { name: { contains: 'vexboost', mode: 'insensitive' } }
                }
            }
        },
        include: {
            providerMappings: {
                include: { provider: true }
            }
        }
    });

    if (!service) throw new Error('No VexBoost-mapped service found. Run expansion seed first.');
    console.log(`Selected Service: ${service.name} (Mapped to: ${service.providerMappings[0].provider.name})`);

    // 3. Initiate Order
    const qty = 100;
    const price = service.pricePer1000.mul(qty).div(1000);
    console.log(`Initiating order for ${qty} items (Price: ${price}₽)...`);

    const order = await initiateOrder({
        userId: admin.id,
        serviceId: service.id,
        projectId: project.id,
        link: 'https://t.me/durov_post/1',
        qty: qty,
        totalPrice: price,
        tgId: Number(admin.tgId),
        username: admin.username || 'admin'
    });

    console.log(`Order created in DB: ${order.id} (Status: ${order.status})`);

    // 4. Process Order (this calls VexBoost)
    console.log('Processing order (calling provider)...');
    await processPendingOrders(order.id);

    // 5. Final Check
    const finalOrder = await prisma.order.findUnique({
        where: { id: order.id }
    });
    console.log(`Final Order Status: ${finalOrder?.status}`);
    if (finalOrder?.status === 'CANCELED') {
        console.log('✅ Order was canceled as expected (likely due to provider error/low balance).');
    } else if (finalOrder?.status === 'PROCESSING') {
        console.log('🚀 Order was successfully accepted by provider!');
    } else {
        console.log(`⚠️ Link status: ${finalOrder?.status}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
