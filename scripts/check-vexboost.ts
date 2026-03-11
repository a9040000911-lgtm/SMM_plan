import { prisma } from '../src/lib/prisma';
import { VexboostProvider } from '../src/services/providers/vexboost.provider';

async function diagnose() {
    console.log('--- Vexboost Diagnosis ---');
    try {
        const provider = await prisma.provider.findFirst({
            where: { name: { contains: 'Vex' } }
        });

        if (!provider) {
            console.error('Vexboost provider not found in DB');
            return;
        }

        console.log(`URL: ${provider.apiUrl}`);
        const vex = new VexboostProvider(provider);

        try {
            const balance = await vex.getBalance();
            console.log('Balance:', balance);
        } catch (err: any) {
            console.error('Balance check failed:', err.message);
        }

        const recentOrders = await prisma.order.findMany({
            where: { providerName: { contains: 'Vex' } },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        console.log('Recent Vexboost Orders:', JSON.stringify(recentOrders, null, 2));

    } catch (err: any) {
        console.error('Global error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
