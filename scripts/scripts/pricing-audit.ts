
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- Аудит цен Smmplan ---');

    const problematicServices = await prisma.internalService.findMany({
        where: {
            isActive: true,
            OR: [
                { lastProviderPrice: 0 },
                { lastProviderPrice: null }
            ]
        },
        include: {
            providerMappings: {
                where: { isActive: true },
                include: {
                    provider: true,
                    providerService: true
                }
            }
        },
        take: 20
    });

    console.log(`Найдено активных услуг с ценой закупки 0: ${problematicServices.length}`);

    for (const s of problematicServices) {
        console.log(`\n📦 ${s.name} (${s.id})`);

        if (s.providerMappings.length === 0) {
            console.log(`  ❌ ОШИБКА: Маппинги отсутствуют или все выключены.`);
            continue;
        }

        for (const m of s.providerMappings) {
            console.log(`  🔗 Маппинг: [${m.provider.name}] ID:${m.providerServiceId} (Приоритет: ${m.priority})`);

            if (!m.providerService) {
                console.log(`  ❌ ОШИБКА: Запись ProviderService не найдена! Возможно, синхронизация провайдера ${m.provider.name} не была запущена.`);
            } else {
                const providerPrice = Number(m.providerService.rawPrice);
                console.log(`  💰 Цена у провайдера: ${providerPrice}`);
                if (providerPrice === 0) {
                    console.log(`  ❌ ОШИБКА: Цена у провайдера РАВНА 0. Нужно обновить каталог через API провайдера.`);
                } else {
                    console.log(`  ✅ У провайдера есть цена (${providerPrice}), но она не синхронизирована с услугой.`);
                }
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
