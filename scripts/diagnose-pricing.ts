import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';

async function diagnose() {
    console.log('🧪 Starting Pricing Diagnosis...\n');

    // 1. Check Currency Rates
    const rates = await prisma.currencyRate.findMany();
    console.log('📈 Currency Rates in DB:');
    rates.forEach(r => console.log(`- ${r.code}: ${r.rate}`));
    if (rates.length === 0) console.log('- (No rates found, system uses hardcoded defaults)\n');

    // 2. Check Providers and their Currencies
    const providers = await prisma.provider.findMany();
    console.log('\n🏢 Providers:');
    providers.forEach(p => {
        const meta = p.metadata as any;
        console.log(`- ${p.name}: Currency = ${meta?.currency || '(default)'}, Type = ${p.type}`);
    });

    // 3. Sample Services with potentially wrong prices
    const services = await prisma.internalService.findMany({
        take: 10,
        include: {
            providerMappings: {
                include: {
                    providerService: true,
                    provider: true
                }
            }
        }
    });

    console.log('\n🔎 Sample Services (Price Analysis):');
    console.log('--------------------------------------------------------------------------------');
    console.log('| Name | Base Price | Last Provider Price | Mapping Price | ROI |');
    console.log('--------------------------------------------------------------------------------');

    services.forEach(s => {
        const basePrice = s.pricePer1000.toNumber();
        const lastProvider = s.lastProviderPrice ? s.lastProviderPrice.toNumber() : 0;
        const mapping = s.providerMappings[0]?.providerService;
        const rawPrice = mapping ? mapping.rawPrice.toNumber() : 0;

        const roi = lastProvider > 0 ? ((basePrice - lastProvider) / lastProvider) * 100 : 0;

        console.log(`| ${s.name.substring(0, 15)}... | ${basePrice.toFixed(2)} | ${lastProvider.toFixed(4)} | ${rawPrice.toFixed(4)} | ${roi.toFixed(0)}% |`);
    });

    console.log('\n🏁 Diagnosis Finished.');
}

diagnose()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
