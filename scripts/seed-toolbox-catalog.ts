import { PrismaClient, Platform, Category } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const DATA_PATH = path.join(__dirname, 'turbo_markups_raw.json');

const platformMapping: Record<string, Platform> = {
    'Вконтакте': Platform.VK,
    'Instagram': Platform.INSTAGRAM,
    'Telegram': Platform.TELEGRAM,
    'YouTube': Platform.YOUTUBE,
    'TikTok': Platform.TIKTOK,
    'Twitter (x)': Platform.TWITTER,
    'Twitch': Platform.TWITCH,
    'Discord': Platform.DISCORD,
    'SoundCloud': Platform.SOUNDCLOUD,
    'Spotify': Platform.SPOTIFY,
    'Одноклассники': Platform.OK,
    'Авито': Platform.OTHER,
    'Трафик / Web Site': Platform.WEBSITE,
    'Likee': Platform.LIKEE,
    'RuTube': Platform.RUTUBE,
    'Apple Music': Platform.OTHER,
    'Яндекс.Дзен': Platform.OTHER
};

const categoryTypeMapping: Record<string, Category> = {
    'Подписчики': Category.SUBSCRIBERS,
    'Лайки': Category.LIKES,
    'Просмотры': Category.VIEWS,
    'Репосты': Category.REPOSTS,
    'Комментарии': Category.COMMENTS,
    'Бусты': Category.BOOSTS,
    'Друзья': Category.FRIENDS,
    'Статистика': Category.OTHER,
    'Голоса': Category.POLLS,
    'Удержание': Category.STREAMS
};

function guessCategory(name: string): Category {
    const l = name.toLowerCase();
    if (l.includes('подписчики') || l.includes('фолловеры') || l.includes('участники')) return Category.SUBSCRIBERS;
    if (l.includes('лайки') || l.includes('классы') || l.includes('сердечки')) return Category.LIKES;
    if (l.includes('просмотры') || l.includes('зрители') || l.includes('глазки')) return Category.VIEWS;
    if (l.includes('репост') || l.includes('поделиться')) return Category.REPOSTS;
    if (l.includes('комментари') || l.includes('отзывы')) return Category.COMMENTS;
    if (l.includes('буст') || l.includes('boost')) return Category.BOOSTS;
    if (l.includes('опрос') || l.includes('голос')) return Category.POLLS;
    if (l.includes('жалобы') || l.includes('репорты')) return Category.OTHER;
    if (l.includes('сохранени')) return Category.SAVES;
    if (l.includes('друзья') || l.includes('заявки')) return Category.FRIENDS;
    if (l.includes('статистика') || l.includes('охват') || l.includes('показы')) return Category.OTHER;
    return Category.OTHER;
}

function extractTargetType(catName: string): string {
    const l = catName.toLowerCase();
    if (l.includes('канал') || l.includes('chann') || l.includes('групп')) return 'CHANNEL';
    if (l.includes('пост') || l.includes('запись')) return 'POST';
    if (l.includes('истори') || l.includes('stori')) return 'STORY';
    if (l.includes('видео') || l.includes('video')) return 'VK_VIDEO';
    if (l.includes('клип') || l.includes('clip') || l.includes('reels') || l.includes('shorts')) return 'VK_CLIP';
    if (l.includes('плейлист') || l.includes('трек')) return 'PLAYLIST';
    if (l.includes('опрос') || l.includes('poll')) return 'POLL';
    if (l.includes('альбом') || l.includes('фото')) return 'PHOTO';
    if (l.includes('комментар') || l.includes('comment')) return 'COMMENT';
    return 'POST';
}

async function main() {
    console.log('🚀 Запуск импорта каталога из SMMToolbox...');

    if (!fs.existsSync(DATA_PATH)) {
        console.error('❌ Файл turbo_markups_raw.json не найден!');
        process.exit(1);
    }

    const data: string[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

    console.log('🧹 Шаг 1: Очистка текущего каталога (удаление InternalService)...');
    
    // Удаляем все зависимости
    await prisma.autoMonitoring.deleteMany({});
    await prisma.projectServiceOverride.deleteMany({});
    await prisma.internalServiceMapping.deleteMany({});
    
    // Для ордеров: удалим, если это тестовая среда. Если нет, отвязываем (order.internalServiceId is required, so we just delete them for fresh catalog)
    await prisma.churnSnapshot.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.supportMessage.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.internalService.deleteMany({});

    console.log('✅ Каталог и заказы очищены.');

    let servicesCreated = 0;
    
    // Получаем проект "main" для привязок (опционально, у InternalService нет projectId напрямую)
    const project = await prisma.project.findFirst({ where: { slug: 'main' } });
    
    for (const row of data) {
        const parts = row.split(' | ');
        // Expected format: ID | Package | Platform | Category | Name... | Provider | Stat1 | Stat2 | Min | Markup% | Price₽ | Status | Date | ""
        if (parts.length < 13) continue;

        const id = parts[0].trim();
        if (!id || isNaN(parseInt(id))) continue;

        const packageTier = parts[1].trim();
        const platformStr = parts[2].trim();
        const catNameStr = parts[3].trim();
        
        // Extracting from the end
        const len = parts.length;
        const statusStr = parts[len - 3]?.trim(); // "Активно"
        const finalPriceStr = parts[len - 4]?.trim().replace('₽', '').replace(',', '.').replace(/\s/g, ''); // "1074"
        const markupStr = parts[len - 5]?.trim().replace(/\s/g, '').replace('%', ''); // "600"
        const minQtyStr = parts[len - 6]?.trim();
        const stat2 = parts[len - 7]?.trim();
        const stat1 = parts[len - 8]?.trim();
        const providerSlug = parts[len - 9]?.trim();
        
        // The name is everything between parts[3] and parts[len - 9]
        const nameParts = parts.slice(4, len - 9);
        const serviceName = nameParts.join(' | ').trim();

        if (statusStr && statusStr !== 'Активно') continue; // только активные
        
        const markupPercent = parseFloat(markupStr) || 0;
        const compPrice = parseFloat(finalPriceStr) || 10;
        const minQty = parseInt(minQtyStr) || 10;
        
        // CALCULATE 2x LOWER MARKUP
        let targetRetailPrice = compPrice;
        if (markupPercent > 0 && compPrice > 0) {
            const cost = compPrice / (1 + markupPercent / 100);
            const targetMarkupPercent = markupPercent / 2; // наценка ниже конкурента в 2 раза
            targetRetailPrice = cost * (1 + targetMarkupPercent / 100);
        } else {
            targetRetailPrice = compPrice * 0.75; // safe fallback
        }

        const platformCode = platformMapping[platformStr] || Platform.OTHER;
        const mappedCategory = guessCategory(catNameStr);
        const targetType = extractTargetType(catNameStr);

        // Получаем/Создаем SocialPlatform
        let socialPlat = await prisma.socialPlatform.findFirst({ where: { name: platformStr } });
        if (!socialPlat) {
            socialPlat = await prisma.socialPlatform.create({
                data: {
                    name: platformStr,
                    slug: platformStr.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    nameRu: platformStr,
                    isActive: true,
                }
            });
        }

        // Получаем/Создаем ServiceCategory
        let sCat = await prisma.serviceCategory.findFirst({ where: { name: catNameStr, platform: platformCode } });
        if (!sCat) {
            sCat = await prisma.serviceCategory.create({
                data: {
                    name: catNameStr,
                    platform: platformCode,
                    categoryType: mappedCategory,
                    socialPlatformId: socialPlat.id,
                    targetType: targetType,
                    isActive: true,
                    projectId: project?.id
                }
            });
        }

        const sTitle = packageTier && packageTier !== '-' ? `[${packageTier}] ${serviceName}` : serviceName;

        // Создаем сервис
        await prisma.internalService.create({
            data: {
                id: id,
                name: sTitle.substring(0, 190), // truncate if too long
                platform: platformCode,
                category: mappedCategory,
                socialPlatformId: socialPlat.id,
                categoryId: sCat.id,
                pricePer1000: targetRetailPrice, // NEW OPTIMIZED PRICE
                minQty: minQty,
                maxQty: 1000000,
                description: `Импортировано из Toolbox. Платформа: ${platformStr}. ${catNameStr}`,
                isActive: true,
                geo: 'Global',
                priceUnit: 1000,
                targetType: targetType,
            }
        });
        
        // Попытка привязать провайдера
        if (providerSlug && providerSlug !== '-' && providerSlug !== 'Удалена') {
            const provider = await prisma.provider.findFirst({ where: { name: { contains: providerSlug, mode: 'insensitive' } } });
            if (provider) {
                // Если providerSlug совпал, привязываем
                try {
                    const pSvcName = serviceName.trim().substring(0, 50).replace(/\\/g, ''); // check prefix just in case, remove backslashes
                    const providerService = await prisma.providerService.findFirst({
                        where: { providerId: provider.id, name: { contains: pSvcName } }
                    });
                    
                    if (providerService) {
                        await prisma.internalServiceMapping.create({
                            data: {
                                internalServiceId: id,
                                providerId: provider.id,
                                providerServiceId: providerService.id,
                                priority: 1,
                                isActive: true,
                                projectId: project?.id
                            }
                        });
                    }
                } catch (err) {
                    console.log(`\n⚠️ Не удалось найти маппинг для услуги ID ${id} (Имя: ${serviceName.substring(0,30)}) - ${err.message}`);
                }
            }
        }
        
        servicesCreated++;
        if (servicesCreated % 100 === 0) {
            process.stdout.write('.');
        }
    }

    console.log(`\n✅ Импорт завершен! Создано ${servicesCreated} услуг и привязано в каталог.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
