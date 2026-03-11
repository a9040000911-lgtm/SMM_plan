
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';
import { TransactionType, TransactionStatus, OrderStatus } from '@prisma/client';
import { confirmPayment, initiateOrder } from '../src/services/orders/order-processor.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🎭 Starting Drip-feed and Mapping simulation...');

    // 1. Get Project and User
    const project = await prisma.project.findUnique({ where: { slug: 'main' } });
    const user = await prisma.user.findFirst({ where: { tgId: BigInt(268747191) } });
    const provider = await prisma.provider.findFirst({ where: { name: 'VexBoost' } });

    if (!project || !user || !provider) {
        throw new Error('Project, User or Provider not found. Run seed first.');
    }

    // 2. Map TEST_TG_SUB_1 to a real VexBoost service (e.g., ID 1293)
    console.log('🔗 Mapping internal service to VexBoost...');
    await prisma.internalServiceMapping.upsert({
        where: {
            projectId_internalServiceId_providerServiceId_providerId: {
                projectId: project.id,
                internalServiceId: 'TEST_TG_SUB_1',
                providerServiceId: 1293, // From early logs
                providerId: provider.id
            }
        },
        update: { isActive: true },
        create: {
            projectId: project.id,
            internalServiceId: 'TEST_TG_SUB_1',
            providerServiceId: 1293,
            providerId: provider.id,
            isActive: true,
            priority: 1
        }
    });

    // 3. Simulate Deposit for Drip-feed Order
    const paymentId = `SIM_DRIP_PAY_${Date.now()}`;
    console.log(`💳 Creating deposit for Drip-feed: ${paymentId}`);
    await prisma.transaction.create({
        data: {
            userId: user.id,
            projectId: project.id,
            amount: new Decimal(1000),
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.PENDING,
            provider: 'YOOKASSA',
            externalId: paymentId,
            metadata: {
                // We'll populate this later or just leave empty during simulation initialization
                isSimulated: true
            }
        }
    });

    // Pre-create orders in AWAITING_PAYMENT status
    const order1 = await prisma.order.create({
        data: {
            userId: user.id,
            projectId: project.id,
            internalServiceId: 'TEST_TG_SUB_1',
            link: 'https://t.me/durov',
            quantity: 2000,
            totalPrice: new Decimal(300),
            status: 'AWAITING_PAYMENT',
            isDripFeed: true,
            runs: 5,
            interval: 60
        }
    });

    const order2 = await prisma.order.create({
        data: {
            userId: user.id,
            projectId: project.id,
            internalServiceId: 'TEST_TG_SUB_1',
            link: 'https://t.me/pavel',
            quantity: 5000,
            totalPrice: new Decimal(750),
            status: 'AWAITING_PAYMENT',
            isDripFeed: true,
            runs: 10,
            interval: 120
        }
    });

    // Update transaction metadata with real IDs
    await prisma.transaction.update({
        where: { externalId: paymentId },
        data: {
            metadata: {
                orderIds: [order1.id, order2.id]
            }
        }
    });

    // 4. Confirm Payment (triggers Drip-feed activation)
    console.log('🌐 Confirming payment and activating Drip-feed orders...');
    await confirmPayment(paymentId);

    // 5. Check order status
    const orders = await prisma.order.findMany({
        where: { id: { in: [order1.id, order2.id] } }
    });

    for (const o of orders) {
        console.log(`📦 Order ${o.id}: Status=${o.status}, isDripFeed=${o.isDripFeed}, runs=${o.runs}`);
    }

    console.log('🏁 Drip-feed simulation finished!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
