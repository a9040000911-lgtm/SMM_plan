
import { prisma } from '../src/lib/prisma';

async function main() {
    const search = process.argv[2] || '2705';
    console.log(`🔎 Поиск услуг, содержащих "${search}"...`);

    const services = await prisma.internalService.findMany({
        where: {
            OR: [
                { id: { contains: search } },
                { name: { contains: search } }
            ]
        },
        include: {
            providerMappings: {
                include: {
                    provider: true,
                    providerService: true
                }
            }
        }
    });

    console.log(`Найдено услуг: ${services.length}`);
    for (const s of services) {
        console.log(`\n📦 [${s.id}] ${s.name}`);
        console.log(`- Активна: ${s.isActive}`);
        console.log(`- Цена продажи: ${s.pricePer1000}`);
        console.log(`- Цена закупки (RUB): ${s.lastProviderPrice}`);
        console.log(`- Цена закупки (Orig): ${s.providerPriceOriginal} ${s.providerCurrencyOriginal || 'RUB'}`);

        if (s.providerMappings.length === 0) {
            console.log(`- ❌ Нет маппингов!`);
        } else {
            for (const m of s.providerMappings) {
                console.log(`- Маппинг [${m.provider.name}]: ID ${m.providerServiceId}, Активен: ${m.isActive}`);
                if (m.providerService) {
                    console.log(`  - Цена у провайдера (RUB): ${m.providerService.rawPrice}`);
                    console.log(`  - Цена у провайдера (Orig): ${m.providerService.rawPriceOriginal} ${m.providerService.rawCurrencyOriginal || 'RUB'}`);
                }
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
