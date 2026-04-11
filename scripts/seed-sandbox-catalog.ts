import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function seedSandbox() {
    const rawData = JSON.parse(fs.readFileSync('scripts/smmtoolbox_parsed.json', 'utf8'));
    console.log(`Loaded ${rawData.length} services...`);

    const mainProject = await prisma.project.findFirst({
        where: { domain: 'smmplan.pro' }
    });

    if (!mainProject) throw new Error("Главный проект не найден");

    const providersMap = new Map<string, string>(); // alias -> providerId

    // 1. Извлечем уникальных провайдеров
    console.log("🛠 Создаем 8 Mock Провайдеров...");
    const parsedServices = rawData.map((item: any) => {
        let providerAlias = 'Unknown';
        if (item.rawNameProvider && item.rawNameProvider.includes('|')) {
            providerAlias = item.rawNameProvider.split('|').pop().trim();
        }
        return { ...item, providerAlias };
    });

    const uniqueAliases = [...new Set(parsedServices.map((s: any) => s.providerAlias))];

    for (const alias of uniqueAliases) {
        let provider = await prisma.provider.findFirst({ where: { name: `[MOCK] ${alias as string}` } });
        if (!provider) {
            provider = await prisma.provider.create({
                data: {
                    name: `[MOCK] ${alias}`,
                    apiUrl: 'https://smmplan.pro/api/mock-provider',
                    apiKey: 'TEST_API_KEY_123',
                    isEnabled: true,
                    type: 'PERFECT_PANEL',
                    projectId: mainProject.id,
                    metadata: { isMock: true, alias }
                }
            });
            console.log(`✅ Создан Провайдер: [MOCK] ${alias}`);
        }
        providersMap.set(alias as string, provider.id);
    }

    // 2. Генерируем "Mock API DB" для роутера
    console.log("🛠 Генерируем базу services для эмулятора API...");
    const apiServices: Record<string, any[]> = {};
    for (const alias of uniqueAliases) {
        apiServices[alias as string] = [];
    }

    // 3. Создаем InternalServices и маппинги
    console.log("🛠 Заливаем услуги в каталог...");
    for (const item of parsedServices) {
        const pId = providersMap.get(item.providerAlias);
        if (!pId) continue;

        const priceNum = parseFloat(item.allCols[9].replace(/[^0-9.]/g, '')) || 100;
        const maxNum = parseInt(item.allCols[7]) || 10000;
        
        // Добавляем в локальный дамп для эмулятора
        apiServices[item.providerAlias].push({
            service: item.id,
            name: `${item.allCols[1]} [${item.category}]`,
            type: 'Default',
            category: item.category,
            rate: priceNum.toString(),
            min: 10,
            max: maxNum,
            description: item.description
        });

        // Создаем публичную услугу в базе (если нет)
        let internalSvc = await prisma.internalService.findFirst({
            where: { name: `${item.category} - ${item.allCols[1]}` }
        });

        if (!internalSvc) {
            internalSvc = await prisma.internalService.create({
                data: {
                    name: `${item.category} - ${item.allCols[1]}`,
                    description: item.description || '',
                    basePrice: priceNum * 1.5, // 50% наценка для тестов
                    minQuantity: 10,
                    maxQuantity: maxNum,
                    status: 'ACTIVE',
                    serviceCategoryId: null,
                    socialPlatformId: null
                }
            });
        }

        // Привязываем услугу к провайдеру (mapping)
        const existingMapping = await prisma.internalServiceMapping.findFirst({
            where: { internalServiceId: internalSvc.id, providerId: pId }
        });

        if (!existingMapping) {
            await prisma.internalServiceMapping.create({
                data: {
                    internalServiceId: internalSvc.id,
                    providerId: pId,
                    providerServiceId: item.id.toString(),
                    isActive: true,
                    priority: 1
                }
            });
        }

        // Также запишем в ProviderService
        const existingProvSvc = await prisma.providerService.findFirst({
            where: { providerId: pId, remoteId: item.id.toString() }
        });

        if (!existingProvSvc) {
            await prisma.providerService.create({
                data: {
                    providerId: pId,
                    remoteId: item.id.toString(),
                    name: `${item.allCols[1]} [${item.category}]`,
                    type: 'Default',
                    category: item.category,
                    rate: priceNum,
                    min: 10,
                    max: maxNum,
                    description: item.description || ''
                }
            });
        }
    }

    // Сохраняем дамп
    fs.writeFileSync('prisma/mock_api_db.json', JSON.stringify(apiServices, null, 2), 'utf8');
    console.log("✅ Сгенерирован prisma/mock_api_db.json (258 услуг разбиты по 8 провайдерам)");

    console.log("✅ Успешно! Sandbox каталог установлен.");
}

seedSandbox().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
