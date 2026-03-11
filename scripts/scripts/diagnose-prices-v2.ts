import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
    console.log('--- Диагностика цен ---');

    // 1. Ищем услуги с ценой 0
    const zeroPriceServices = await prisma.internalService.findMany({
        where: {
            OR: [
                { lastProviderPrice: 0 },
                { lastProviderPrice: null }
            ],
            isActive: true
        },
        include: {
            providerMappings: {
                include: {
                    provider: true,
                    providerService: true
                }
            }
        },
        take: 10
    });

    console.log(`Найдено услуг с нулевой ценой закупки: ${zeroPriceServices.length}`);

    for (const s of zeroPriceServices) {
        console.log(`\nУслуга: ${s.name} (${s.id})`);
        console.log(`- Глобальная цена продажи: ${s.pricePer1000}`);

        if (s.providerMappings.length === 0) {
            console.log(`- ❌ ОШИБКА: Нет маппингов на провайдера!`);
        } else {
            for (const m of s.providerMappings) {
                console.log(`- Маппинг: Провайдер ${m.provider.name}, ID услуги провайдера: ${m.providerServiceId}`);
                if (m.providerService) {
                    console.log(`  - Цена у провайдера (rawPrice): ${m.providerService.rawPrice}`);
                    if (Number(m.providerService.rawPrice) === 0) {
                        console.log(`  - ❌ ОШИБКА: У провайдера цена 0! Нужно запустить синхронизацию этого провайдера.`);
                    } else {
                        console.log(`  - ✅ У провайдера есть цена, но она не перенеслась в InternalService.`);
                    }
                } else {
                    console.log(`  - ❌ ОШИБКА: Запись ProviderService не найдена в БД!`);
                }
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
