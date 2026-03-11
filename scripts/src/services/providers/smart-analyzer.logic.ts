/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { DescriptionSanitizer } from '@/utils/description-sanitizer';

export interface AnalyzedService {
    platform: Platform;
    platformSlug: string;
    category: Category;
    targetType: string;
    isPrivate: boolean;
    description_ru: string;
    suggestedName?: string;
    requirements?: string;
}

export const PLATFORMS = ['TELEGRAM', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'VK', 'TWITCH', 'DISCORD', 'TWITTER', 'FACEBOOK', 'THREADS', 'REDDIT', 'RUTUBE', 'DZEN', 'MUSIC', 'OK', 'KICK', 'LIKEE', 'WHATSAPP', 'SPOTIFY', 'SOUNDCLOUD', 'LINKEDIN', 'PINTEREST', 'SNAPCHAT', 'TROVO', 'KWAI', 'MESSENGER_MAX', 'GOOGLE', 'APPLE', 'YANDEX', 'STEAM', 'RUMBLE', 'TUMBLR', 'VIMEO', 'SHAZAM', 'QUORA', 'MEDIUM', 'WEBSITE', 'PERISCOPE', 'CLOUDHUB', 'AUDIOMACK', 'DATPIFF', 'OTHER'];
export const CATEGORIES = ['SUBSCRIBERS', 'GROUPS', 'LIKES', 'VIEWS', 'COMMENTS', 'REACTIONS', 'REPOSTS', 'BOOSTS', 'POLLS', 'STORIES', 'BOTS', 'REFERRALS', 'FRIENDS', 'PLAYS', 'TRAFFIC', 'DISLIKES', 'STARS', 'WATCH_TIME', 'SAVES', 'STREAMS', 'PREMIUM', 'RECOVER', 'OTHER'];
export const TARGET_TYPES = ['CHANNEL', 'POST', 'PROFILE', 'VIDEO', 'VK_VIDEO', 'VK_CLIP', 'VK_PLAY', 'CHANNEL_POSTS', 'STORY', 'COMMENTS', 'POLL', 'PHOTO', 'MARKET', 'PLAYLIST', 'ALBUM', 'EXTERNAL', 'TG_CHANNEL', 'TG_POST', 'TG_BOT', 'TG_STORY', 'TG_STARS', 'TG_BOOST', 'VK_PLAY_CHANNEL', 'VK_PLAY_LIVE', 'CUSTOM'];

export const PLATFORM_LABELS: Record<string, string> = {
    TELEGRAM: 'Telegram',
    INSTAGRAM: 'Instagram',
    TIKTOK: 'TikTok',
    YOUTUBE: 'YouTube',
    VK: 'ВКонтакте',
    TWITCH: 'Twitch',
    OTHER: 'Другое',
    DISCORD: 'Discord',
    TWITTER: 'Twitter (X)',
    FACEBOOK: 'Facebook',
    THREADS: 'Threads',
    REDDIT: 'Reddit',
    RUTUBE: 'Rutube',
    DZEN: 'Дзен',
    MUSIC: 'Музыка (Spotify/Apple)',
    OK: 'Одноклассники',
    KICK: 'Kick',
    LIKEE: 'Likee',
    WHATSAPP: 'WhatsApp',
    SPOTIFY: 'Spotify',
    SOUNDCLOUD: 'SoundCloud',
    LINKEDIN: 'LinkedIn',
    PINTEREST: 'Pinterest',
    SNAPCHAT: 'Snapchat',
    TROVO: 'Trovo',
    KWAI: 'Kwai',
    MESSENGER_MAX: 'Messenger MAX (VK)',
    GOOGLE: 'Google',
    APPLE: 'Apple Music/Podcast',
    YANDEX: 'Яндекс (Дзен/Maps/Music)',
    STEAM: 'Steam',
    RUMBLE: 'Rumble',
    TUMBLR: 'Tumblr',
    VIMEO: 'Vimeo',
    SHAZAM: 'Shazam',
    QUORA: 'Quora',
    MEDIUM: 'Medium',
    WEBSITE: 'Website Traffic',
    PERISCOPE: 'Periscope',
    CLOUDHUB: 'CloudHub',
    AUDIOMACK: 'Audiomack',
    DATPIFF: 'DatPiff',
};

export const CATEGORY_LABELS: Record<string, string> = {
    SUBSCRIBERS: '👨‍👩‍👧‍👦 Подписчики / Участники',
    GROUPS: '👥 Вступление в группы / чаты',
    LIKES: '❤️ Лайки / Нравится',
    VIEWS: '👁 Просмотры / Охват',
    COMMENTS: '💬 Комментарии / Отзывы',
    REACTIONS: '🎭 Реакции / Эмодзи',
    REPOSTS: '📢 Репосты / Поделиться',
    BOOSTS: '🚀 Бусты (Telegram Levels)',
    POLLS: '📊 Голоса / Опросы',
    STORIES: '📱 Сториз / Истории',
    BOTS: '🤖 Роботы / Боты',
    REFERRALS: '🔗 Рефералы (Apps/Bots)',
    FRIENDS: '🤝 Заявки в друзья',
    PLAYS: '🎵 Прослушивания (Music)',
    TRAFFIC: '🌐 Трафик / Посещения',
    DISLIKES: '👎 Дизлайки',
    STARS: '⭐ Звезды (Telegram Stars)',
    WATCH_TIME: '⏳ Часы просмотра (YouTube)',
    SAVES: '📌 Сохранения / Saves',
    STREAMS: '📺 Стримы / Зрители',
    PREMIUM: '💎 Премиум подписки',
    RECOVER: '🔄 Восстановление / Докрутка',
    OTHER: '📦 Другое / Разное',
};

export const TARGET_TYPE_LABELS: Record<string, string> = {
    CHANNEL: 'Канал/Группа',
    POST: 'Пост/Публикация',
    PROFILE: 'Профиль/Аккаунт',
    VIDEO: 'Видео/Reels',
    VK_VIDEO: 'VK Видео',
    VK_CLIP: 'VK Клип',
    VK_PLAY: 'VK Play Стрим',
    CHANNEL_POSTS: 'Посты канала (Авто)',
    STORY: 'Сторис',
    COMMENTS: 'Комментарии',
    POLL: 'Опрос',
    PHOTO: 'Фото',
    MARKET: 'Товар/Маркет',
    PLAYLIST: 'Плейлист',
    ALBUM: 'Альбом',
    EXTERNAL: 'Внешняя ссылка',
    TG_CHANNEL: 'TG Канал/Группа',
    TG_POST: 'TG Пост',
    TG_BOT: 'TG Бот/Реферал',
    TG_STORY: 'TG Сторис',
    TG_STARS: 'TG Звезды',
    TG_BOOST: 'TG Бусты',
    VK_PLAY_CHANNEL: 'VK Play Канал',
    VK_PLAY_LIVE: 'VK Play Стрим',
    CUSTOM: 'Свой тип (API)',
};

export const PLATFORM_KEYWORDS: Record<string, string[]> = {
    TELEGRAM: ['telegram', 'tg', 'телеграм', 'тг'],
    INSTAGRAM: ['instagram', 'inst', 'инстаграм', 'инста'],
    VK: ['vk', 'вк', 'vkontakte', 'вконтакте'],
    YOUTUBE: ['youtube', 'yt', 'ютуб'],
    TIKTOK: ['tiktok', 'тикток', 'тт'],
    FACEBOOK: ['facebook', 'фейсбук'],
    TWITTER: ['twitter', 'x.com', 'твиттер'],
    DISCORD: ['discord', 'дискорд'],
    THREADS: ['threads'],
    REDDIT: ['reddit'],
    TWITCH: ['twitch', 'твич'],
    KICK: ['kick'],
    RUTUBE: ['rutube', 'рутуб'],
    DZEN: ['dzen', 'дзен'],
    MUSIC: ['music', 'музыка'],
    OK: ['ok', 'одноклассники'],
    LIKEE: ['likee'],
    WHATSAPP: ['whatsapp', 'ватсап'],
    SPOTIFY: ['spotify', 'спотифай'],
    SOUNDCLOUD: ['soundcloud'],
    LINKEDIN: ['linkedin'],
    PINTEREST: ['pinterest'],
    SNAPCHAT: ['snapchat'],
    TROVO: ['trovo'],
    KWAI: ['kwai'],
    MESSENGER_MAX: ['messenger', 'max', 'макс'],
    GOOGLE: ['google', 'гугл', 'gmap', 'review', 'отзыв'],
    APPLE: ['apple', 'podcast', 'itunes'],
    YANDEX: ['yandex', 'яндекс', 'ya.ru'],
    STEAM: ['steam', 'стим'],
    RUMBLE: ['rumble'],
    TUMBLR: ['tumblr'],
    VIMEO: ['vimeo'],
    SHAZAM: ['shazam'],
    QUORA: ['quora'],
    MEDIUM: ['medium'],
    WEBSITE: ['website', 'traffic', 'трафик', 'site', 'сайт'],
    PERISCOPE: ['periscope'],
    CLOUDHUB: ['cloudhub'],
    AUDIOMACK: ['audiomack'],
    DATPIFF: ['datpiff'],
    MAX: ['max'],
    OTHER: []
};

// IMPORTANT: Order matters for detection!
export const CATEGORY_MAP: Record<string, string[]> = {
    SUBSCRIBERS: ['subscriber', 'member', 'follow', 'participant', 'reader', 'подписчики', 'подписчик', 'участники', 'участник', 'фолловер'],
    VIEWS: ['view', 'eye', 'watch', 'просмотр', 'гляделок', 'глаз', 'посещен', 'охват', 'стат', 'visit', 'reach', 'stat', 'impressions'],
    BOTS: ['bot', 'бот'],
    LIKES: ['like', 'fav', 'heart', 'лайк', 'сердечк', 'классы', 'мне нравится'],
    COMMENTS: ['comment', 'review', 'коммент', 'отзыв'],
    REACTIONS: ['reaction', 'emoji', 'реакци', 'эмодзи'],
    REPOSTS: ['repost', 'share', 'репост', 'поделиться'],
    POLLS: ['poll', 'vote', 'опрос', 'голос', 'викторин'],
    STORIES: ['story', 'stories', 'сторис', 'истори'],
    BOOSTS: ['boost', 'буст', 'level', 'уровень'],
    REFERRALS: ['referral', 'реферал'],
    FRIENDS: ['friend', 'друг', 'друзья'],
    RECOVER: ['recover', 'восстанов', 'refill', 'докрут'],
    TRAFFIC: ['traffic', 'website', 'трафик'],
    DISLIKES: ['dislike', 'дизлайк'],
    GROUPS: ['group', 'chat', 'channel', 'чат', 'группа', 'канал', 'сообщест', 'паблик'],
    PLAYS: ['play', 'слуш', 'прослуш'],
    STARS: ['star', 'звезд'],
    WATCH_TIME: ['hour', 'watch time', 'время просмотр', 'часы просмотр'],
    SAVES: ['save', 'сохран', 'bookmark'],
    PREMIUM: ['premium', 'премиум'],
    STREAMS: ['viewer', 'stream', 'зрител', 'стрим', 'online', 'онлайн'],
    OTHER: []
};

export class SmartAnalyzerLogic {
    static detectSync(
        name: string,
        description: string = '',
        categoryInput: string = '',
        dynamicPlatforms?: Array<{ slug: string, keywords: string[], name: string }>,
        dynamicLinkTypes?: Array<{ platform: Platform, slug: string, name: string, keywords: string[] }>
    ): AnalyzedService {
        const sanitizedDescription = DescriptionSanitizer.sanitize(description);
        const nameLower = name.toLowerCase();
        const n = (name + ' ' + sanitizedDescription + ' ' + categoryInput).toLowerCase();

        // 1. Detect Platform
        let platformEnum: Platform = 'OTHER';
        let platformSlug: string = 'other';
        let dynamicMatch = false;

        if (dynamicPlatforms && dynamicPlatforms.length > 0) {
            for (const p of dynamicPlatforms) {
                if (p.keywords.some(k => n.includes(k.toLowerCase()))) {
                    platformSlug = p.slug.toLowerCase();
                    dynamicMatch = true;
                    const upperSlug = p.slug.toUpperCase();
                    if (Object.keys(PLATFORM_KEYWORDS).includes(upperSlug)) {
                        platformEnum = upperSlug as Platform;
                    }
                    break;
                }
            }
        }

        if (!dynamicMatch) {
            for (const [p, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
                if (keywords.some(k => n.includes(k))) {
                    platformEnum = p as Platform;
                    platformSlug = p.toLowerCase();
                    break;
                }
            }
        }

        // 2. Detect Category
        let category: Category = 'OTHER';

        // High priority check for BOTS to avoid miscategorization with subscribers
        if ((nameLower.includes('бот') || nameLower.includes(' bot')) && !nameLower.includes('подпис') && !nameLower.includes('участник')) {
            category = 'BOTS';
        } else {
            for (const [c, keywords] of Object.entries(CATEGORY_MAP)) {
                if (keywords.some(k => n.includes(k))) {
                    category = c as Category;
                    break;
                }
            }
        }

        const effectivePlatform = platformEnum;

        // --- Platform Specific Refinements ---

        if (effectivePlatform === 'VK') {
            const hasViewKeywords = n.includes('просмотр') || n.includes('глазик') || n.includes('охват');
            const hasVideoKeywords = n.includes('видео') || n.includes('video') || n.includes('clip') || n.includes('клип') || n.includes('товар') || n.includes('услуг');

            if (hasViewKeywords && hasVideoKeywords) category = 'VIEWS';
            else if (n.includes('в друзья') || n.includes('на профиль') || n.includes('на страницу')) category = 'FRIENDS';
            else if (n.includes('в группу') || n.includes('в сообщество') || n.includes('паблик')) category = 'GROUPS';
            else if (n.includes('подкаст') || n.includes('прослушиван') || n.includes('плейлист')) category = 'PLAYS';
            else if (n.includes('глазик') || n.includes('на запись') || n.includes('на пост')) category = 'VIEWS';
            else if (n.includes('опрос') || n.includes('голос')) category = 'POLLS';
        }

        if (effectivePlatform === 'TELEGRAM') {
            const isSubscriberName = nameLower.includes('подпис') || nameLower.includes('участник') || nameLower.includes('member') || nameLower.includes('subscriber');
            const isStoryName = nameLower.includes('истори') || nameLower.includes('story') || nameLower.includes('stories');
            const isPostName = nameLower.includes('просмотр') || nameLower.includes('реакци') || nameLower.includes('view') || nameLower.includes('reaction');
            const isBotName = (nameLower.includes('бот') || nameLower.includes(' bot') || nameLower.includes('запуск') || nameLower.includes('старт')) && !nameLower.includes('быстрый');
            const isStars = nameLower.includes('stars') || nameLower.includes('звезд') || (categoryInput.toLowerCase().includes('stars'));
            const isBoost = nameLower.includes('буст') || nameLower.includes('boost');
            const isReferral = nameLower.includes('реферал') || nameLower.includes('referral');

            if (isStars) category = 'STARS';
            else if (isBoost) category = 'BOOSTS';
            else if (isStoryName) category = 'STORIES';
            else if (isReferral) category = 'REFERRALS';
            else if (isSubscriberName) category = 'SUBSCRIBERS';
            else if (isPostName) category = (nameLower.includes('реакци') || nameLower.includes('reaction')) ? 'REACTIONS' : 'VIEWS';
            else if (isBotName) category = 'BOTS';
        }

        if (effectivePlatform === 'INSTAGRAM') {
            const checkText = (text: string) => {
                if (text.includes('story') || text.includes('сторис') || text.includes('истори')) return 'STORIES';
                if (text.includes('подпис') || text.includes('subscriber') || text.includes('фолловер')) return 'SUBSCRIBERS';
                if (text.includes('лайк') || text.includes('like')) return 'LIKES';
                if (text.includes('поделиться') || text.includes('share')) return 'REPOSTS';
                if (text.includes('сохран') || text.includes('save')) return 'SAVES';
                if (text.includes('коммент') || text.includes('comment')) return 'COMMENTS';
                if (text.includes('просмотр') || text.includes('view') || text.includes('reel') || text.includes('проигрыван')) return 'VIEWS';
                return null;
            };
            const detected = checkText(nameLower) || checkText(n);
            if (detected) category = detected as Category;
        }

        if (effectivePlatform === 'YOUTUBE' && (n.includes('час') || n.includes('hour'))) category = 'WATCH_TIME';
        if (effectivePlatform === 'TIKTOK' && (n.includes('share') || n.includes('поделиться'))) category = 'REPOSTS';
        if (effectivePlatform === 'TWITTER' && (n.includes('retweet') || n.includes('ретвит'))) category = 'REPOSTS';

        // 3. Target Type Determination
        let targetType = 'POST';
        let targetDetected = false;

        // Try dynamic link types first
        if (dynamicLinkTypes && dynamicLinkTypes.length > 0) {
            // Sort by keyword length (descending) to match more specific keywords first
            const sortedTypes = [...dynamicLinkTypes].sort((a, b) =>
                Math.max(...b.keywords.map(k => k.length)) - Math.max(...a.keywords.map(k => k.length))
            );

            for (const lt of sortedTypes) {
                if (lt.platform === effectivePlatform && lt.keywords.some(k => n.includes(k.toLowerCase()))) {
                    targetType = lt.slug; // Keep original slug (case sensitive as per DB)
                    targetDetected = true;
                    break;
                }
            }
        }

        const isPrivate = n.includes('private') || n.includes('priv ') || n.includes('закрыт') || n.includes('приват') || n.includes('канал c') || n.includes('для закрытых');

        if (targetDetected) {
            // Priority given to dynamic detection
        } else if (effectivePlatform === 'TELEGRAM') {
            if ((category as string) === 'STARS') targetType = 'TG_STARS';
            else if ((category as string) === 'BOTS' || (category as string) === 'REFERRALS') targetType = 'TG_BOT';
            else if (category === 'STORIES') targetType = 'TG_STORY';
            else if (category === 'BOOSTS') targetType = 'TG_BOOST';
            else if (['VIEWS', 'REACTIONS', 'REPOSTS', 'COMMENTS'].includes(category)) targetType = 'TG_POST';
            else if (['SUBSCRIBERS', 'GROUPS'].includes(category)) targetType = 'TG_CHANNEL';
            else targetType = 'TG_CHANNEL';
        } else if (effectivePlatform === 'INSTAGRAM') {
            if (category === 'SUBSCRIBERS') targetType = 'PROFILE';
            else if (category === 'STORIES') targetType = 'STORY';
            else if (n.includes('reel') || n.includes('video') || n.includes('видео') || n.includes(' igtv')) targetType = 'VIDEO';
            else targetType = 'POST';
        } else if (effectivePlatform === 'VK') {
            if (n.includes('vk play') || n.includes('play') || n.includes('stream') || n.includes('стрим') || n.includes('зрител')) {
                const isSubValue = n.includes('подпис') || n.includes('sub') || n.includes('follow') || category === 'SUBSCRIBERS';
                targetType = isSubValue ? 'VK_PLAY_CHANNEL' : 'VK_PLAY_LIVE';
            } else if (n.includes('poll') || n.includes('опрос') || n.includes('голос')) targetType = 'POLL';
            else if (['FRIENDS', 'SUBSCRIBERS'].includes(category) && (n.includes('профиль') || n.includes('друзья'))) targetType = 'PROFILE';
            else if (['GROUPS', 'SUBSCRIBERS'].includes(category)) targetType = 'CHANNEL';
            else if (n.includes('video') || n.includes('clip') || n.includes('клип') || n.includes('видео') || category === 'VIEWS') {
                targetType = (n.includes('clip') || n.includes('клип')) ? 'VK_CLIP' : 'VK_VIDEO';
            } else if (category === 'STORIES') targetType = 'STORY';
            else if (n.includes('wall') || n.includes('стен') || n.includes('пост') || n.includes('запись')) targetType = 'POST';
            else targetType = 'CHANNEL';
        } else {
            if (n.includes('auto') || n.includes('subscription') || n.includes('авто')) {
                targetType = 'CHANNEL_POSTS';
            } else if (['SUBSCRIBERS', 'GROUPS', 'FRIENDS'].includes(category)) {
                targetType = (['INSTAGRAM', 'TIKTOK'].includes(effectivePlatform as string)) ? 'PROFILE' : 'CHANNEL';
            } else if (n.includes('video') || n.includes('reel') || n.includes('shorts') || category === 'VIEWS') {
                targetType = 'VIDEO';
            } else {
                targetType = 'POST';
            }
        }

        // 4. Generate Selling Description
        const isFast = n.includes('fast') || n.includes('instant') || n.includes('быстр') || n.includes('мгновен');
        const isReal = n.includes('real') || n.includes('active') || n.includes('живы') || n.includes('реальн');
        const isNoDrop = n.includes('no drop') || n.includes('non drop') || n.includes('без отписок') || n.includes('гарант');
        const isHQ = n.includes('hq') || n.includes('high quality') || n.includes('высокое качество');

        let sellingDescription = '';
        if (category === 'SUBSCRIBERS' || category === 'GROUPS' || category === 'FRIENDS') {
            const typeLabel = category === 'FRIENDS' ? 'друзья' : (category === 'GROUPS' ? 'участники' : 'подписчики');
            sellingDescription = `### 🚀 Качественные ${typeLabel}\n* **Качество**: ${isReal ? 'Живые пользователи' : isHQ ? 'Высокое (HQ)' : 'Стандартные аккаунты'}\n* **Скорость**: ${isFast ? 'Мгновенный старт' : 'Плавное добавление'}\n* **Гарантия**: ${isNoDrop ? 'От списаний (Refill)' : 'Стабильное выполнение'}\n`;
        } else if (category === 'LIKES') {
            sellingDescription = `### ❤️ Лайки на ваши публикации\n* **Запуск**: ${isFast ? 'Автоматический (быстрый)' : '10-30 минут'}\n* **Тип**: ${isReal ? 'От реальных людей' : 'Качественные профили'}\n`;
        } else if (category === 'VIEWS') {
            sellingDescription = `### 👁 Просмотры контента\n* **Старт**: Моментальный\n* **Удержание**: ${isHQ ? 'Максимальное' : 'Стандартное'}\n`;
        } else if (category === 'REACTIONS') {
            sellingDescription = `### 🎭 Реакции (Эмодзи)\n* **Тип**: ${n.includes('random') ? 'Случайные положительные' : 'Выбранные вами'}\n* **Скорость**: Мгновенное распределение\n* **Эффект**: Повышает доверие и охваты поста\n`;
        } else {
            const platformName = dynamicMatch && dynamicPlatforms
                ? dynamicPlatforms.find(p => p.slug.toLowerCase() === platformSlug)?.name || platformSlug
                : PLATFORM_LABELS[effectivePlatform] || effectivePlatform;

            sellingDescription = (sanitizedDescription && sanitizedDescription.length > 10)
                ? sanitizedDescription
                : `### ✨ Услуга для ${platformName}\nПродвижение вашего проекта с гарантией качества и быстрой скоростью выполнения.`;
        }

        // 5. Suggested Name Cleanup
        let suggestedName = name;
        suggestedName = suggestedName.replace(/\[.*?\]/g, '').replace(/ID\d+/gi, '').replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim();
        if (isHQ && !suggestedName.toLowerCase().includes('hq')) suggestedName += ' [HQ]';
        if (isReal && !suggestedName.toLowerCase().includes('живые')) suggestedName += ' [Живые]';

        // 6. Detect Requirements
        let requirements: string | undefined = undefined;
        if (effectivePlatform === 'INSTAGRAM') {
            const reqs = [];
            if (n.includes('публичн') || n.includes('открыт') || n.includes('public')) reqs.push("Профиль/Пост должен быть открытым (публичным).");
            if (n.includes('ссылку на профиль') || n.includes('ссылка на профиль')) reqs.push("Указывать ссылку на профиль.");
            else if (n.includes('ссылку на пост') || n.includes('ссылка на пост')) reqs.push("Указывать ссылку на конкретную публикацию.");
            if (reqs.length > 0) requirements = reqs.join(" ");
        }

        const botMatch = n.match(/(@[a-z0-9_]+bot)/i);
        const hasAdminKeywords = n.includes('админ') || n.includes('добавьте') || n.includes('назнач') || n.includes('права');
        if (botMatch && hasAdminKeywords) {
            requirements = `Для работы услуги необходимо добавить бота ${botMatch[0]} в администраторы вашего канала/группы с правами на сообщения/репосты.`;
        }

        return {
            platform: platformEnum,
            platformSlug,
            category,
            targetType,
            isPrivate,
            description_ru: sellingDescription,
            suggestedName,
            requirements
        };
    }

    static suggestTargetType(name: string, category: string, description: string = ''): string {
        return this.detectSync(name, description, category).targetType;
    }

    static suggestIsPrivate(name: string): boolean {
        return this.detectSync(name).isPrivate;
    }

    static suggestCategory(name: string, category: string = ''): Category {
        return this.detectSync(name, '', category).category;
    }
}
