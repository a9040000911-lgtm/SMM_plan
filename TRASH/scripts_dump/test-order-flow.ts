
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('--- STARTING BACKEND ORDER FLOW TEST (V7.4.1) ---');

    // Find the project first (slug '101')
    const project = await prisma.project.findUnique({ where: { slug: '101' } });
    if (!project) throw new Error('Test project 101 not found. Run seed script first.');

    const email = 'admin@test.com';
    const serviceId = 'test-svc-001';

    const user = await prisma.user.findFirst({ where: { email, projectId: project.id } });
    if (!user) throw new Error('Admin user not found');

    const service = await prisma.internalService.findUnique({ where: { id: serviceId } });
    if (!service) throw new Error('Service not found');

    const quantity = 100;
    const totalPrice = new Decimal(service.pricePer1000).mul(quantity).div(1000);

    console.log(`User balance before: ${user.balance}`);

    // Create Order via Transaction (Simulating the core flow from route.ts)
    const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: {
                balance: { decrement: totalPrice },
                spent: { increment: totalPrice || 0 }
            }
        });

        const order = await tx.order.create({
            data: {
                projectId: project.id,
                userId: user.id,
                internalServiceId: service.id,
                link: 'https://instagram.com/p/test',
                quantity,
                totalPrice,
                costPrice: service.lastProviderPrice,
                status: 'PENDING',
                runs: 1,
                interval: 0,
                currentRun: 0
            }
        });
        return { order, updatedUser };
    });

    console.log(`✅ Order created successfully: ID ${result.order.id}`);
    console.log(`User balance after: ${result.updatedUser.balance}`);

    // Verify presence in DB
    const verifiedOrder = await prisma.order.findUnique({
        where: { id: result.order.id },
        include: { internalService: true }
    });

    if (verifiedOrder) {
        console.log(`🔍 Verified DB Order: ${verifiedOrder.internalService.name} | Status: ${verifiedOrder.status}`);
    } else {
        throw new Error('Verification failed: Order not found in DB after creation!');
    }

    console.log('--- TEST COMPLETED SUCCESSFULLY ---');
}

main()
    .catch((e) => {
        console.error('❌ TEST FAILED:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
