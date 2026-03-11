import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function suggestPlatform(name: string, category: string = '', rawData: any = {}): string {
    const n = (name + ' ' + category).toLowerCase();

    if (rawData.soc) {
        const soc = String(rawData.soc).toLowerCase();
        if (soc.includes('telegram') || soc === 'tg') return 'TELEGRAM';
        if (soc.includes('instagram') || soc === 'ig') return 'INSTAGRAM';
        if (soc.includes('vk')) return 'VK';
        if (soc.includes('tiktok') || soc === 'tt') return 'TIKTOK';
        if (soc.includes('youtube') || soc === 'yt') return 'YOUTUBE';
        if (soc.includes('twitch')) return 'TWITCH';
        if (soc.includes('discord')) return 'DISCORD';
        if (soc.includes('twitter')) return 'TWITTER';
        if (soc.includes('facebook') || soc === 'fb') return 'FACEBOOK';
    }

    const c = category.toLowerCase();
    if (c.includes('tiktok') || c.includes('тт')) return 'TIKTOK';
    if (c.includes('rutube')) return 'RUTUBE';
    if (c.includes('dzen') || c.includes('дзен')) return 'DZEN';
    if (c.includes('music') || c.includes('spotify') || c.includes('apple') || c.includes('shazam') || c.includes('музыка')) return 'MUSIC';
    if (c.includes('twitch') || c.includes('твич')) return 'TWITCH';
    if (c.includes('ok') || c.includes('классники')) return 'OK';

    if (n.includes('telegram') || n.includes('tg') || n.includes('телеграм')) return 'TELEGRAM';
    if (n.includes('instagram') || n.includes('ig') || n.includes('инстаграм') || n.includes('insta')) return 'INSTAGRAM';
    if (n.includes('vk') || n.includes('вк') || n.includes('вконтакте')) return 'VK';
    if (n.includes('tiktok') || n.includes('tt') || n.includes('тик ток') || n.includes('тикток')) return 'TIKTOK';
    if (n.includes('youtube') || n.includes('yt') || n.includes('ютуб') || n.includes('youtu.be')) return 'YOUTUBE';
    if (n.includes('twitch') || n.includes('твич')) return 'TWITCH';
    if (n.includes('discord') || n.includes('дискорд')) return 'DISCORD';
    if (n.includes('twitter') || n.includes('твиттер') || n.includes(' x.com')) return 'TWITTER';
    if (n.includes('facebook') || n.includes('фейсбук') || n.includes('fb ')) return 'FACEBOOK';
    if (n.includes('threads')) return 'THREADS';
    if (n.includes('reddit')) return 'REDDIT';
    if (n.includes('rutube')) return 'RUTUBE';
    if (n.includes('dzen') || n.includes('дзен')) return 'DZEN';
    if (n.includes('ok.ru') || n.includes('одноклассники')) return 'OK';

    return 'OTHER';
}

function suggestCategory(name: string, category: string = ''): string {
    const n = (name + ' ' + category).toLowerCase();
    if (n.includes('subscriber') || n.includes('member') || n.includes('follow') || n.includes('participant') || n.includes('reader') || n.includes('подписчи') || n.includes('участни') || n.includes('фолловер')) return 'SUBSCRIBERS';
    if (n.includes('like') || n.includes('fav') || n.includes('heart') || n.includes('лайк') || n.includes('сердечк') || n.includes('классы') || n.includes('мне нравится') || n.includes('сохр') || n.includes('save')) return 'LIKES';
    if (n.includes('view') || n.includes('eye') || n.includes('watch') || n.includes('stream') || n.includes('просмотр') || n.includes('гляделок') || n.includes('глаз') || n.includes('посещен') || n.includes('охват') || n.includes('стат') || n.includes('visit') || n.includes('reach') || n.includes('stat') || n.includes('impressions')) return 'VIEWS';
    if (n.includes('comment') || n.includes('review') || n.includes('коммент') || n.includes('отзыв')) return 'COMMENTS';
    if (n.includes('reaction') || n.includes('emoji') || n.includes('реакци') || n.includes('эмодзи')) return 'REACTIONS';
    if (n.includes('story') || n.includes('stories') || n.includes('сторис') || n.includes('истори')) return 'STORIES';
    if (n.includes('poll') || n.includes('vote') || n.includes('опрос') || n.includes('голос')) return 'POLLS';
    if (n.includes('repost') || n.includes('share') || n.includes('репост') || n.includes('поделиться')) return 'REPOSTS';
    if (n.includes('boost') || n.includes('буст')) return 'BOOSTS';
    if (n.includes('referral') || n.includes('реферал')) return 'REFERRALS';
    if (n.includes('friend') || n.includes('друг') || n.includes('друзья')) return 'FRIENDS';
    if (n.includes('play') || n.includes('прослушиван') || n.includes('воспроизведени')) return 'PLAYS';
    if (n.includes('reels') || n.includes('рилс')) return 'VIEWS';
    if (n.includes('bot') || n.includes('бот')) return 'BOTS';
    return 'OTHER';
}

async function main() {
    console.log('--- STARTING SERVICE RE-CATEGORIZATION ---');

    const services = await prisma.internalService.findMany({
        include: {
            providerMappings: {
                include: {
                    providerService: true
                }
            }
        }
    });

    console.log(`Analyzing ${services.length} services...`);

    let updatedCount = 0;

    for (const service of services) {
        const primaryMapping = service.providerMappings[0];
        if (!primaryMapping) continue;

        const providerService = primaryMapping.providerService;
        const rawData = providerService.rawData as any;

        const newPlatform = suggestPlatform(service.name, rawData?.category || '', rawData || {});
        const newCategory = suggestCategory(service.name, rawData?.category || '');

        if (newPlatform !== service.platform || newCategory !== service.category) {
            console.log(`Updating "${service.name}": Platform ${service.platform} -> ${newPlatform}, Category ${service.category} -> ${newCategory}`);
            await prisma.internalService.update({
                where: { id: service.id },
                data: {
                    platform: newPlatform as any,
                    category: newCategory as any
                }
            });
            updatedCount++;
        }
    }

    console.log(`--- FINISHED. Updated ${updatedCount} services. ---`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
