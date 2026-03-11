
import { ProviderService, ServiceSyncService } from '../src/services/providers';
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';

// Override for local execution
process.env.DATABASE_URL = 'postgresql://smmuser:smmpassword@localhost:5433/smmplan?schema=public';

async function main() {
    console.log('--- Debugging Currency Sync ---');

    // 1. Check Provider Name exactly
    const p = await prisma.provider.findFirst({ where: { name: 'STREAM-PROMOTION' } });
    if (!p) { console.error('Provider STREAM-PROMOTION not found'); return; }
    console.log(`Provider found: "${p.name}"`);

    // 2. Run Sync for just this provider logic (mocking the loop or calling syncAll)
    console.log('Running ServiceSyncService.syncAllServices()...');
    // We can't easily isolate just one provider in the current method without changing code, 
    // but the method iterates all enabled providers.
    await ServiceSyncService.syncAllServices();

    // 3. Check specific known service price
    // ID 12387 was 0.002 (USD)
    const s = await prisma.providerService.findUnique({
        where: {
            id_providerId: {
                id: 12387,
                providerId: p.id
            }
        }
    });

    if (s) {
        console.log(`Service 12387 Price: ${s.rawPrice.toString()} (Expected ~0.19 if x96 applied)`);
        if (s.rawPrice.lessThan(0.01)) {
            console.error('FAILURE: Price is still near zero. Multiplier NOT applied.');
        } else {
            console.log('SUCCESS: Price is converted.');
        }
    } else {
        console.log('Service 12387 not found, checking any service > 0.1');
        const anyS = await prisma.providerService.findFirst({
            where: { providerId: p.id, rawPrice: { gt: 0.1 } }
        });
        if (anyS) {
            console.log(`Found converted service: ${anyS.id} - ${anyS.name} = ${anyS.rawPrice}`);
        } else {
            console.log('No services > 0.1 found. Everything is 0?');
            const zeroS = await prisma.providerService.findFirst({
                where: { providerId: p.id }
            });
            console.log('Sample service:', zeroS ? `${zeroS.id}: ${zeroS.rawPrice}` : 'None');
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
