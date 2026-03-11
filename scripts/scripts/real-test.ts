
import { prisma } from '../src/lib/prisma';
import { ProviderService, ServiceSyncService } from '../src/services/providers';
import { CryptoService } from '../src/services/core/crypto.service';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('--- Starting Real Integration Test ---');

    // 1. Update Provider API Key
    // New key provided by user
    const REAL_KEY = 'XIXeUVGftzSXwAg8pbBJERcJpMmrg9qujHHM3y95xYvB3Q9VMnAHGYtpGnta';
    const encryptedKey = CryptoService.encrypt(REAL_KEY);

    await prisma.provider.updateMany({
        where: { name: 'vexboost' },
        data: {
            apiKey: encryptedKey,
            isEnabled: true,
            apiUrl: 'https://vexboost.ru/api/v2'
        }
    });

    const p = await prisma.provider.findFirst({ where: { name: 'vexboost' } });
    console.log(`✅ Provider "vexboost" updated in DB.`);
    if (p) {
        const dec = CryptoService.decrypt(p.apiKey);
        console.log(`✅ Decrypted Key Length: ${dec.length}`);
        console.log(`✅ Decrypted Key Start: ${dec.substring(0, 5)}...`);
    }

    // 2. Sync Services
    console.log('🔄 Syncing services from Vexboost...');
    try {
        await ServiceSyncService.syncAllServices();
        console.log('✅ Services synced successfully.');
    } catch (e: any) {
        console.error('❌ Sync failed:', e.message);
        if (e.response?.data) console.error('Response:', e.response.data);
        if (e.config?.data) {
            const dataParts = e.config.data.split('&');
            const keyPart = dataParts.find((p: string) => p.startsWith('key='));
            console.log('Request Key Length:', keyPart ? keyPart.split('=')[1].length : 'N/A');
        }
        return;
    }

    // 3. Find a cheap service to test order
    const providerService = await prisma.providerService.findFirst({
        where: { provider: { name: 'vexboost' } },
        orderBy: { rawPrice: 'asc' }
    });

    if (!providerService) {
        console.error('❌ No services found after sync.');
        return;
    }

    console.log(`📌 Found test service: ${providerService.name} (Price: ${providerService.rawPrice})`);

    // 4. Create internal service and mapping
    const internalSvcId = 'REAL_TEST_SVC';
    const internalSvc = await prisma.internalService.upsert({
        where: { id: internalSvcId },
        update: { isActive: true },
        create: {
            id: internalSvcId,
            name: `Test: ${providerService.name}`,
            pricePer1000: providerService.rawPrice.mul(1.5),
            minQty: 100,
            maxQty: 1000,
            platform: 'TELEGRAM',
            category: 'OTHER',
            geo: 'RU',
            description: 'Real integration test service',
            isActive: true
        }
    });

    const project = await prisma.project.findFirst();
    if (!project) throw new Error('No project found.');

    await prisma.internalServiceMapping.upsert({
        where: {
            projectId_internalServiceId_providerServiceId_providerId: {
                projectId: project.id,
                internalServiceId: internalSvc.id,
                providerId: providerService.providerId,
                providerServiceId: providerService.id
            }
        },
        update: { isActive: true },
        create: {
            projectId: project.id,
            internalServiceId: internalSvc.id,
            providerId: providerService.providerId,
            providerServiceId: providerService.id,
            priority: 1,
            isActive: true
        }
    });

    console.log('✅ Internal service and mapping created.');

    // 5. Place order
    console.log('🚀 Checking balance and attempting to place order...');

    if (p) {
        const instance = await ProviderService.getInstance(p.id);
        if (instance) {
            try {
                const { balance } = await instance.getBalance();
                console.log(`💰 Provider Balance: ${balance}`);
            } catch (bErr: any) {
                console.warn('⚠️ Could not fetch balance:', bErr.message);
            }
        }
    }

    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) return;

    await prisma.user.update({ where: { id: user.id }, data: { balance: { increment: 100 } } });

    try {
        const orderResult = await ProviderService.createOrder({
            internalServiceId: internalSvc.id,
            link: 'https://t.me/smmMarket69/29', // Updated post link
            quantity: 100,
            userId: user.id
        } as any);

        if (orderResult.success) {
            console.log('🎉 ORDER SUCCESS!', orderResult);
        } else {
            console.error('❌ ORDER FAILED:', orderResult.error);
        }
    } catch (e: any) {
        console.error('❌ Order exception:', e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
