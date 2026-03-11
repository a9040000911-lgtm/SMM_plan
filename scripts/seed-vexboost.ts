import { PrismaClient, Platform, Category, Currency, ServiceType } from '@prisma/client';

const CATEGORY_TRANSLATIONS: Record<string, string> = {
    SUBSCRIBERS: 'Подписчики',
    LIKES: 'Лайки',
    VIEWS: 'Просмотры',
    REACTIONS: 'Реакции',
    REPOSTS: 'Репосты',
    COMMENTS: 'Комментарии',
    OTHER: 'Другое',
    BOOSTS: 'Бусты',
    POLLS: 'Опросы',
    STORIES: 'Истории',
    BOTS: 'Боты',
    REFERRALS: 'Рефералы',
    FRIENDS: 'Друзья',
    PLAYS: 'Прослушивания',
    RECOVER: 'Восстановление',
    PREMIUM: 'Премиум',
    TRAFFIC: 'Трафик',
    DISLIKES: 'Дизлайки',
    GROUPS: 'Группы',
    STREAMS: 'Стримы',
    STARS: 'Звезды',
    WATCH_TIME: 'Часы просмотра',
    SAVES: 'Сохранения',
};

const prisma = new PrismaClient();
const VEXBOOST_API_KEY = 'XIXeUVGftzSXwAg8pbBJERcJpMmrg9qujHHM3y95xYvB3Q9VMnAHGYtpGnta';
const VEXBOOST_API_URL = 'https://vexboost.ru/api/v2';

const TARGET_TOTAL_SERVICES = 180; // Target ~150-200
const MAX_SERVICES_PER_CAT = 7;
const TARGET_HQ_PERCENTAGE = 0.90;

interface VexboostService {
    service: number;
    name: string;
    type: string;
    category: string;
    rate: string;
    min: number;
    max: number;
    description?: string;
}

// Helpers for quality heuristic
function isHQ(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('жив') || n.includes('premium') || n.includes('выс') || n.includes('real') || n.includes('hq');
}

function isLQ(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('бот') || n.includes('эконом') || n.includes('дешев') || n.includes('быстр');
}

// Maps Vexboost Category -> Our Platform + Category + TargetType
function mapCategory(vexCat: string): { platform: Platform, category: Category, targetType: string } | null {
    const c = vexCat.toLowerCase();

    if (c.includes('telegram') || c.includes('tg')) {
        if (c.includes('реакции') || c.includes('reaction') || c.includes('mix')) {
            return { platform: 'TELEGRAM', category: 'REACTIONS', targetType: 'POST' };
        }
        if (c.includes('подписчики') || c.includes('subscribers') || c.includes('буст') || c.includes('boost')) {
            return { platform: 'TELEGRAM', category: 'SUBSCRIBERS', targetType: 'CHANNEL' };
        }
        if (c.includes('просмотр') || c.includes('views') || c.includes('авто')) {
            return { platform: 'TELEGRAM', category: 'VIEWS', targetType: 'POST' };
        }
    }

    if (c.includes('vk') || c.includes('вконтакте')) {
        if (c.includes('подписчики') || c.includes('друзья') || c.includes('группу')) {
            return { platform: 'VK', category: 'SUBSCRIBERS', targetType: 'CHANNEL' }; // Or Profile, default CHANNEL
        }
        if (c.includes('лайк')) {
            return { platform: 'VK', category: 'LIKES', targetType: 'POST' };
        }
        if (c.includes('просмотр')) {
            return { platform: 'VK', category: 'VIEWS', targetType: 'POST' };
        }
    }

    if (c.includes('instagram') || c.includes('ig')) {
        if (c.includes('подписчики') || c.includes('followers')) {
            return { platform: 'INSTAGRAM', category: 'SUBSCRIBERS', targetType: 'PROFILE' };
        }
        if (c.includes('лайк') || c.includes('likes')) {
            return { platform: 'INSTAGRAM', category: 'LIKES', targetType: 'POST' };
        }
        if (c.includes('просмотр') || c.includes('views')) {
            return { platform: 'INSTAGRAM', category: 'VIEWS', targetType: 'POST' }; // Or VIDEO for reels
        }
    }

    if (c.includes('youtube') || c.includes('yt')) {
        if (c.includes('подписчики')) return { platform: 'YOUTUBE', category: 'SUBSCRIBERS', targetType: 'CHANNEL' };
        if (c.includes('просмотр')) return { platform: 'YOUTUBE', category: 'VIEWS', targetType: 'VIDEO' };
        if (c.includes('лайк')) return { platform: 'YOUTUBE', category: 'LIKES', targetType: 'VIDEO' };
    }

    return null; // Ignore unsupported categories to keep it clean
}

// Format Name with Tiers
function formatServiceName(name: string, category: Category, priceDetails: { baseRate: number }): { cleanedName: string, markup: number } {
    // Determine tier based on explicit keywords or base price proxy
    let tier = '';
    const n = name.toLowerCase();

    if (n.includes('жив')) tier = '[Живые] ';
    else if (n.includes('премиум') || n.includes('premium') || n.includes('hq') || n.includes('выс')) tier = '[Премиум] ';
    else if (n.includes('эконом') || n.includes('дешев') || n.includes('бот')) tier = '[Эконом] ';
    else tier = '[Стандарт] ';

    // Exceptions where tiers don't make sense
    if (category === 'REACTIONS' || category === 'VIEWS') {
        tier = ''; // usually don't need 'Live' for views
    }

    // Calculate dynamic markup based on base price to achieve ~1000% target average
    // Lower price -> higher markup 
    // Base rates are usually per 1000 in RUB.
    const basePrice = priceDetails.baseRate;
    let markupMultiplier = 12.0; // Default 1200%

    if (basePrice < 5) {
        markupMultiplier = 40.0; // Super cheap, big markup (4000%)
    } else if (basePrice < 20) {
        markupMultiplier = 20.0; // Cheap (2000%)
    } else if (basePrice < 100) {
        markupMultiplier = 12.0; // Average (1200%)
    } else if (basePrice < 500) {
        markupMultiplier = 8.0;  // Expensive (800%)
    } else {
        markupMultiplier = 5.0;  // Very expensive (500%)
    }

    // Ensure random variation
    markupMultiplier = markupMultiplier * (0.9 + Math.random() * 0.2); // +/- 10%

    // Clean name logic - optionally remove old bracket tags from provider
    let rawClean = name.replace(/\[.*?\]/g, '').replace(/\|.*/, '').trim();
    // Ensure we don't end up with empty names
    if (rawClean.length < 5) rawClean = name.replace(/\[.*?\]/g, '').trim();

    return { cleanedName: `${tier}${rawClean}`.trim(), markup: markupMultiplier };
}


async function main() {
    console.log('🚀 Starting Phase 8: Vexboost API Integration & Seeding...');

    // 1. Ensure internal data structures
    let project = await prisma.project.findFirst();
    if (!project) {
        project = await prisma.project.create({
            data: { name: 'Smmplan Main', slug: 'main', domain: 'localhost' }
        });
    }

    // Ensure Platforms
    const platNames = ['TELEGRAM', 'VK', 'INSTAGRAM', 'YOUTUBE'];
    for (const plat of platNames) {
        await prisma.socialPlatform.upsert({
            where: { slug: plat.toLowerCase() },
            update: {},
            create: { slug: plat.toLowerCase(), name: plat, isActive: true }
        });
    }

    // Categories cache mapping Platform -> Category -> ServiceCategory.id
    const catCache: Record<string, string> = {};

    async function getCategoryId(platform: Platform, category: Category, targetType: string) {
        const key = `${platform}_${category}`;
        if (catCache[key]) return catCache[key];

        const social = await prisma.socialPlatform.findUnique({ where: { slug: platform.toLowerCase() } });
        const localizedName = CATEGORY_TRANSLATIONS[category] || category;

        let dbCat = await prisma.serviceCategory.findFirst({
            where: { platform, name: localizedName, projectId: project!.id }
        });

        if (!dbCat) {
            const slug = `${platform.toLowerCase()}-${localizedName.toLowerCase()}`.replace(/\s+/g, '-');
            dbCat = await prisma.serviceCategory.create({
                data: {
                    name: localizedName,
                    slug: slug,
                    platform,
                    categoryType: category,
                    targetType,
                    isActive: true,
                    projectId: project!.id,
                    socialPlatformId: social?.id
                }
            });
        }
        catCache[key] = dbCat.id;
        return dbCat.id;
    }

    // 2. Fetch from Vexboost
    console.log('Fetching Vexboost API...');
    const res = await fetch(`${VEXBOOST_API_URL}?key=${VEXBOOST_API_KEY}&action=services`);
    if (!res.ok) throw new Error(`Vexboost API error: ${res.statusText}`);
    const rawData: VexboostService[] = await res.json();
    console.log(`Received ${rawData.length} services from Vexboost.`);

    // 3. Intelligent Filtering
    const selectedServices: VexboostService[] = [];
    const categoryCounts: Record<string, number> = {};

    // First sort to favor HQ if possible, then distribute
    const hqServices = rawData.filter(s => isHQ(s.name));
    const lqServices = rawData.filter(s => isLQ(s.name) && !isHQ(s.name));
    const otherServices = rawData.filter(s => !isHQ(s.name) && !isLQ(s.name));

    const targetHQCount = Math.floor(TARGET_TOTAL_SERVICES * TARGET_HQ_PERCENTAGE);

    // Distribution algorithm
    for (const pool of [hqServices, otherServices, lqServices]) {
        for (const s of pool) {
            if (selectedServices.length >= TARGET_TOTAL_SERVICES) break;

            const mapped = mapCategory(s.category);
            if (!mapped) continue; // Skip unsupported

            const catKey = `${mapped.platform}_${mapped.category}`;
            if (!categoryCounts[catKey]) categoryCounts[catKey] = 0;

            if (categoryCounts[catKey] < MAX_SERVICES_PER_CAT) {
                selectedServices.push(s);
                categoryCounts[catKey]++;
            }
        }
    }

    console.log(`Successfully filtered down to ${selectedServices.length} target services.`);

    // 4. Upsert Provider
    const provider = await prisma.provider.upsert({
        where: { name: 'Vexboost' },
        update: { apiUrl: VEXBOOST_API_URL, apiKey: VEXBOOST_API_KEY, isEnabled: true },
        create: {
            name: 'Vexboost',
            apiUrl: VEXBOOST_API_URL,
            apiKey: VEXBOOST_API_KEY,
            isEnabled: true,
            type: 'universal',
            balanceCurrency: 'RUB',
            pricesCurrency: 'RUB',
            projectId: project.id
        }
    });

    // 5. Build Internal Services & Mappings
    let count = 0;
    for (const s of selectedServices) {
        const mapped = mapCategory(s.category);
        if (!mapped) continue; // safety check

        const catId = await getCategoryId(mapped.platform, mapped.category, mapped.targetType);
        const basePrice = parseFloat(s.rate);
        const { cleanedName, markup } = formatServiceName(s.name, mapped.category, { baseRate: basePrice });

        const retailPrice = parseFloat((basePrice * markup).toFixed(2));
        const internalId = `${mapped.platform}_${s.service}_vxb`.toLowerCase();

        // ProviderService
        const ps = await prisma.providerService.upsert({
            where: { providerId_externalId: { providerId: provider.id, externalId: s.service.toString() } },
            update: {
                rawPrice: basePrice,
                rawData: s as any,
                name: s.name,
                category: mapped.category,
                platform: mapped.platform,
                dataHash: 'hash_placeholder'
            },
            create: {
                externalId: s.service.toString(),
                providerId: provider.id,
                name: s.name,
                rawPrice: basePrice,
                rawData: s as any,
                category: mapped.category,
                platform: mapped.platform,
                dataHash: 'hash_placeholder'
            }
        });

        // InternalService
        const internal = await prisma.internalService.upsert({
            where: { id: internalId },
            update: {
                name: cleanedName,
                pricePer1000: retailPrice,
                minQty: s.min,
                maxQty: s.max,
                description: s.description || s.name,
                markup: markup,
                categoryId: catId
            },
            create: {
                id: internalId,
                platform: mapped.platform,
                category: mapped.category,
                name: cleanedName,
                pricePer1000: retailPrice,
                minQty: s.min,
                maxQty: s.max,
                description: s.description || s.name,
                geo: 'Мир',
                targetType: mapped.targetType,
                markup: markup,
                isActive: true,
                categoryId: catId,
                socialPlatformId: (await prisma.socialPlatform.findUnique({ where: { slug: mapped.platform.toLowerCase() } }))?.id
            }
        });

        // Mapping
        await prisma.internalServiceMapping.upsert({
            where: {
                projectId_internalServiceId_providerId: {
                    projectId: project.id,
                    internalServiceId: internal.id,
                    providerId: provider.id
                }
            },
            update: {},
            create: {
                projectId: project.id,
                internalServiceId: internal.id,
                providerServiceId: ps.id,
                providerId: provider.id,
                priority: 1,
                isActive: true
            }
        });

        count++;
    }

    console.log(`✅ Seeded ${count} services securely attached to Vexboost!`);

    // Diagnostic
    const internalCount = await prisma.internalService.count();
    console.log(`Total Internal Services in DB now: ${internalCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
