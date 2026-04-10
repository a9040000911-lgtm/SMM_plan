import { prisma } from '../src/lib/prisma';
import { ProviderService } from '../src/services/providers/provider.service';
import { Decimal } from 'decimal.js';

async function main() {
    const o = await prisma.order.findUnique({
        where: { id: 4 },
        include: { internalService: true }
    });

    if (!o) {
        console.log('Order 4 not found');
        return process.exit(0);
    }

    console.log('--- ORDER 4 ---');
    console.log({
        id: o.id,
        status: o.status,
        internalServiceId: o.internalServiceId,
        quantity: o.quantity,
        totalPrice: o.totalPrice,
    });

    const userPaidPer1000 = o.totalPrice.mul(1000).div(o.quantity);
    console.log('User Paid per 1000:', userPaidPer1000.toString());

    const mappings = await prisma.internalServiceMapping.findMany({
        where: {
            internalServiceId: o.internalServiceId,
            projectId: o.projectId,
            isActive: true
        },
        include: { provider: true }
    });

    console.log('\n--- MAPPINGS ---');
    console.log('Count:', mappings.length);

    for (const m of mappings) {
        console.log(`\nMapping ID: ${m.id}`);
        console.log(`Provider: ${m.provider.name}`);

        // Check balance log
        const lastBalance = await prisma.providerBalanceLog.findFirst({
            where: { providerId: m.providerId },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`Last DB Balance:`, lastBalance?.balance?.toString());

        // Check provider service
        const providerSvc = await prisma.providerService.findUnique({
            where: { id_providerId: { id: m.providerServiceId, providerId: m.providerId } }
        });
        console.log(`Provider Service Found:`, !!providerSvc);
        if (providerSvc) {
            console.log(`Provider Service Raw Price:`, providerSvc.rawPrice.toString());
            if (providerSvc.rawPrice.gte(userPaidPer1000)) {
                console.log(`Margin Guard: BLOCK (Raw Price ${providerSvc.rawPrice} >= User Paid ${userPaidPer1000})`);
            } else {
                console.log(`Margin Guard: PASS`);
            }
        }

        try {
            const instance = await ProviderService.getInstance(m.providerId);
            if (instance) {
                const { balance } = await instance.getBalance();
                console.log(`Real-time API Balance:`, balance);
            }
        } catch (e: any) {
            console.log(`Real-time Balance Error:`, e.message);
        }
    }

    process.exit(0);
}

main().catch(console.error);
