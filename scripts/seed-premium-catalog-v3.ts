import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();
const JSON_FILE = 'final_catalog_premium.json';
const CSV_FILE = 'vexboost_interchangeable_map.csv';

// Утилита для генерации slug
function generateSlug(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// Простейшая транслитерация для slug (если русские буквы)
function cyrillicToLatin(text: string) {
    const cyrillic = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
    return text.toLowerCase().split('').map(char => cyrillic[char] || char).join('');
}

async function seedCatalog() {
    console.log("🚀 Запуск сидера финального каталога v3 (Связи с платформами и категориями)...");
    
    // Получаем провайдера
    const vexboost = await prisma.provider.findFirst({ where: { name: 'Vexboost' } }) 
                  || await prisma.provider.findFirst();
                  
    if (!vexboost) throw new Error("No provider found in DB");
    console.log("Found provider:", vexboost.name, "ID:", vexboost.id);

    // Загружаем JSON с премиум описаниями
    const premiumData: any[] = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    
    // Загружаем CSV для получения внешних ID
    const csvLines = fs.readFileSync(CSV_FILE, 'utf8').split('\n').filter(l => l.trim().length > 0);
    csvLines.shift(); // skip header
    const csvMap = new Map();
    for(const line of csvLines) {
        const cols = line.split(';');
        const targetTier = cols[0].replace(/^"|"$/g, '');
        const matchType = cols[1].replace(/^"|"$/g, '');
        const vexboostId = cols[2].replace(/^"|"$/g, '');
        const vexboostPrice = parseFloat(cols[4].replace(/^"|"$/g, '')) || 10;
        csvMap.set(targetTier, { matchType, vexboostId, vexboostPrice });
    }

    let inserted = 0;
    
    // Чтобы не было конфликтов уникальности при параллельном создании платформ, кэшируем в памяти
    const platformCache = new Map<string, string>(); // name -> id
    const categoryCache = new Map<string, string>(); // action -> id

    for (const item of premiumData) {
        const csvInfo = csvMap.get(item.targetSmmplanTier);
        if (!csvInfo) {
            console.warn(`Внимание! Нет данных в CSV для ${item.targetSmmplanTier}`);
            continue;
        }

        const { matchType, vexboostId, vexboostPrice } = csvInfo;

        // 1. Платформа
        let platformId = platformCache.get(item.platform);
        if (!platformId) {
            let plat = await prisma.socialPlatform.findFirst({ where: { name: item.platform } });
            if (!plat) {
                const slug = generateSlug(cyrillicToLatin(item.platform)) || 'unknown';
                // Валидация slug unique
                let finalSlug = slug;
                let c = 1;
                while(await prisma.socialPlatform.findUnique({where: {slug: finalSlug}})) {
                    finalSlug = `${slug}-${c++}`;
                }
                plat = await prisma.socialPlatform.create({
                    data: {
                        id: require('crypto').randomUUID(),
                        name: item.platform,
                        slug: finalSlug,
                        isActive: true,
                        updatedAt: new Date()
                    }
                });
            }
            platformId = plat.id;
            platformCache.set(item.platform, platformId);
        }

        // 2. Категория
        let catKey = `${platformId}_${item.action}`;
        let categoryId = categoryCache.get(catKey);
        if (!categoryId) {
            // Внимание: ServiceCategory имеет Unique(projectId, socialPlatformId, slug) или Unique(projectId, platform, name)
            // У нас platform (Enum) может быть устаревшим, но он обязателен. Поставим OTHER если что.
            let cat = await prisma.serviceCategory.findFirst({
                where: { socialPlatformId: platformId, name: item.action }
            });
            if (!cat) {
                 const slug = generateSlug(cyrillicToLatin(item.action)) || 'cat';
                 let finalSlug = slug;
                 // Мы не проверяем уникальность с projectId=null (глобально), но Prisma может ругаться, 
                 // так как у нас есть @@unique([projectId, platform, name]). 
                 // projectId = null. platform = OTHER. 
                 cat = await prisma.serviceCategory.create({
                    data: {
                        id: require('crypto').randomUUID(),
                        name: item.action,
                        description: item.action,
                        platform: "OTHER", // Legacy Enum, required field
                        socialPlatformId: platformId,
                        slug: finalSlug,
                        isActive: true,
                        updatedAt: new Date()
                    }
                });
            }
            categoryId = cat.id;
            categoryCache.set(catKey, categoryId);
        }

        // 3. Создаем услугу
        let servicePrice = vexboostPrice * 1.5; 
        if (servicePrice < 10) servicePrice = 10;
        
        // Транзакция для сервиса и маппинга
        await prisma.$transaction(async (tx) => {
             const newService = await tx.internalService.create({
                data: {
                    id: require('crypto').randomUUID(),
                    name: item.name,
                    description: item.description,
                    requirements: item.requirements,
                    geo: "WORLD",
                    pricePer1000: servicePrice,
                    minQty: 100,
                    maxQty: 10000,
                    type: "REGULAR",
                    isActive: matchType === "DIRECT_100%", // Только 100% совпадения активы
                    socialPlatformId: platformId,
                    categoryId: categoryId,
                    curatorNote: matchType !== "DIRECT_100%" ? `Маппинг требует проверки. Похожий ID: ${vexboostId}` : undefined,
                    updatedAt: new Date()
                }
            });

            // Маппинг
            const provService = await tx.providerService.findFirst({
                where: { providerId: vexboost.id, externalId: vexboostId }
            });

            if (provService) {
                await tx.internalServiceMapping.create({
                    data: {
                        id: require('crypto').randomUUID(),
                        internalServiceId: newService.id,
                        providerServiceId: provService.id,
                        providerId: vexboost.id,
                        priority: 1,
                        reliability: matchType === "DIRECT_100%" ? 100 : 70, 
                        isActive: true
                    }
                });
            } else {
                console.log(`[Warning] No ProviderService found for externalId ${vexboostId} in Vexboost.`);
            }
        });

        inserted++;
        if (inserted % 50 === 0) console.log(`👉 Интегрировано ${inserted} услуг...`);
    }

    console.log(`\n🎉 УСПЕШНО ИНТЕГРИРОВАНО ${inserted} ПРЕМИУМ-УСЛУГ (с правильной таксономией)!`);
}

seedCatalog().catch(e => console.error(e)).finally(() => prisma.$disconnect());
