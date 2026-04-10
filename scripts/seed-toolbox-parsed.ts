import { PrismaClient, Platform, Category } from '../src/generated/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const DATA_PATH = path.join(__dirname, 'smmtoolbox_parsed.json');

const platformMapping: Record<string, Platform> = {
    'Вконтакте': Platform.VK,
    'VKontakte': Platform.VK,
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
    'Трафик на сайт': Platform.WEBSITE,
    'Likee': Platform.LIKEE,
    'RuTube': Platform.RUTUBE,
    'Apple Music': Platform.OTHER,
    'Яндекс.Дзен': Platform.OTHER,
    'Дзен': Platform.OTHER
};

// ... category guesser logic ...
function guessCategory(name: string): Category {
    const l = name.toLowerCase();
    if (l.includes('подписчики') || l.includes('фолловеры') || l.includes('участники') || l.includes('followers')) return Category.SUBSCRIBERS;
    if (l.includes('лайки') || l.includes('классы') || l.includes('сердечки') || l.includes('likes')) return Category.LIKES;
    if (l.includes('просмотры') || l.includes('зрители') || l.includes('глазки') || l.includes('views')) return Category.VIEWS;
    if (l.includes('репост') || l.includes('поделиться') || l.includes('reposts') || l.includes('shares')) return Category.REPOSTS;
    if (l.includes('комментари') || l.includes('отзывы') || l.includes('comments')) return Category.COMMENTS;
    if (l.includes('буст') || l.includes('boost')) return Category.BOOSTS;
    if (l.includes('опрос') || l.includes('голос') || l.includes('votes')) return Category.POLLS;
    if (l.includes('друзья') || l.includes('заявки')) return Category.FRIENDS;
    if (l.includes('статистика') || l.includes('охват') || l.includes('показы') || l.includes('stats')) return Category.OTHER;
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
    if (l.includes('альбом') || l.includes('фото') || l.includes('photo')) return 'PHOTO';
    if (l.includes('комментар') || l.includes('comment')) return 'COMMENT';
    return 'POST';
}

async function main() {
    console.log('🚀 Запуск импорта каталога из smmtoolbox_parsed.json (строгий режим: удаляем если нет провайдера)...');

    if (!fs.existsSync(DATA_PATH)) {
        console.error('❌ Файл smmtoolbox_parsed.json не найден!');
        process.exit(1);
    }

    const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
    const data: any[] = JSON.parse(rawData);

    console.log('🧹 Очистка текущего каталога и связанных данных...');
    
    await prisma.autoMonitoring.deleteMany({});
    await prisma.projectServiceOverride.deleteMany({});
    await prisma.internalServiceMapping.deleteMany({});
    await prisma.churnSnapshot.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.supportMessage.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.internalService.deleteMany({});
    
    // Not deleting SocialPlatform and ServiceCategory for safety, they are meant to be stable

    console.log('✅ Очистка завершена.');

    let servicesCreated = 0;
    let servicesSkipped = 0;
    
    const project = await prisma.project.findFirst({ where: { slug: 'main' } });
    const localProviders = await prisma.provider.findMany(); // get all providers to match exactly by name

    for (const item of data) {
        if (!item.id || isNaN(parseInt(item.id))) continue;

        const originalId = item.id;
        const platformStr = item.platform || 'Авито';
        const catNameStr = item.category || 'Прочее';
        const rawNameProvider: string = item.rawNameProvider || '';
        const allCols = item.allCols || [];
        
        let providerSlug = '';
        let serviceName = rawNameProvider;
        
        if (rawNameProvider.includes('|')) {
            const parts = rawNameProvider.split('|');
            providerSlug = parts.pop()?.trim() || '';
            serviceName = parts.join('|').trim();
        }

        const packageTier = allCols[1] || '';
        if (packageTier && packageTier !== '-') {
            serviceName = `[${packageTier}] ${serviceName}`;
        }

        const markupStr = allCols[8]?.replace(/\s/g, '').replace('%', '') || '0';
        const finalPriceStr = allCols[9]?.replace('₽', '').replace(',', '.').replace(/\s/g, '') || '0';
        const minQtyStr = allCols[7]?.replace(/\\s/g, '') || '10';

        const markupPercent = parseFloat(markupStr) || 0;
        const compPrice = parseFloat(finalPriceStr) || 10;
        const minQty = parseInt(minQtyStr, 10) || 10;

        // Поиск провайдера в локальной БД (с учетом алиасов mock-провайдеров)
        const providerAliasMap: Record<string, string> = {
            'soc_rocket': 'SocRocket Mock',
            'smm_panelus': 'SMM Panel US Mock',
            'stream_promotion': 'Stream Promotion Mock',
            'vexboost': 'vexboost',
            'smmprime': 'SMM Prime Mock'
        };

        const aliasName = providerAliasMap[providerSlug.toLowerCase()] || providerSlug;

        let matchedProvider = null;
        if (aliasName) {
            matchedProvider = localProviders.find(p => p.name.toLowerCase() === aliasName.toLowerCase() || p.name.toLowerCase().includes(aliasName.toLowerCase()));
        }

        // Если НЕТ локального провайдера - ПРОПУСКАЕМ услугу полностью!
        if (!matchedProvider) {
            // console.log(`⏩ Пропущена услуга ${originalId} (${serviceName}) - Провайдер '${providerSlug}' не найден локально.`);
            servicesSkipped++;
            continue;
        }

        // Пытаемся точечно найти ProviderService чтобы привязать к провайдеру
        let matchedProviderServiceId: string | undefined = undefined;
        try {
            const cleanSvcName = serviceName.trim().replace(/^\\[[^\\]]+\\]\\s*/, '').substring(0, 50).trim();
            const pService = await prisma.providerService.findFirst({
                where: { providerId: matchedProvider.id, name: { contains: cleanSvcName } }
            });
            if (pService) {
                matchedProviderServiceId = pService.id;
            }
        } catch(e) {}

        if (!matchedProviderServiceId) {
            // Фолбэк: берем любой ProviderService от этого Provider просто чтобы создать маппинг
            const fallback = await prisma.providerService.findFirst({ where: { providerId: matchedProvider.id }});
            if (fallback) {
                matchedProviderServiceId = fallback.id;
            } else {
                servicesSkipped++;
                continue;
            }
        }

        // Exact 30% discount vs Smmtoolbox price to undercut them safely
        let targetRetailPrice = compPrice * 0.70;

        const platformCode = platformMapping[platformStr] || Platform.OTHER;
        const mappedCategory = guessCategory(catNameStr);
        const targetType = extractTargetType(catNameStr);

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

        let sCat = await prisma.serviceCategory.findFirst({ where: { name: catNameStr, platform: platformCode } });
        if (!sCat) {
            sCat = await prisma.serviceCategory.create({
                data: {
                    name: catNameStr,
                    platform: platformCode,
                    categoryType: mappedCategory,
                    socialPlatformId: socialPlat.id,
                    isActive: true,
                    projectId: project?.id
                }
            });
        }

        // Создаем сервис
        await prisma.internalService.create({
            data: {
                id: originalId,
                name: serviceName.substring(0, 190),
                platform: platformCode,
                category: mappedCategory,
                socialPlatformId: socialPlat.id,
                categoryId: sCat.id,
                pricePer1000: targetRetailPrice,
                minQty: minQty,
                maxQty: 1000000,
                description: item.description || `Импортировано из Toolbox. Платформа: ${platformStr}. ${catNameStr}`,
                isActive: true,
                geo: 'Global',
                priceUnit: 1000,
                targetType: targetType,
            }
        });

        // Создаем маппинг
        await prisma.internalServiceMapping.create({
            data: {
                internalServiceId: originalId,
                providerId: matchedProvider.id,
                providerServiceId: matchedProviderServiceId as string,
                priority: 1,
                isActive: true,
                projectId: project?.id
            }
        });

        servicesCreated++;
    }

    console.log(`\\n✅ Импорт завершен! Создано: ${servicesCreated}. Пропущено (нет провайдера): ${servicesSkipped}.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
