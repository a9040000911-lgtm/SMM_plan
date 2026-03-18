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
export const CATEGORIES = ['SUBSCRIBERS', 'GROUPS', 'LIKES', 'VIEWS', 'COMMENTS', 'REACTIONS', 'REPOSTS', 'BOOSTS', 'POLLS', 'STORIES', 'BOTS', 'REFERRALS', 'FRIENDS', 'PLAYS', 'TRAFFIC', 'DISLIKES', 'STARS', 'WATCH_TIME', 'SAVES', 'OTHER'];
export const TARGET_TYPES = ['CHANNEL', 'POST', 'PROFILE', 'VIDEO', 'VK_VIDEO', 'VK_CLIP', 'VK_PLAY', 'CHANNEL_POSTS', 'STORY', 'COMMENTS', 'POLL', 'PHOTO', 'MARKET', 'PLAYLIST', 'ALBUM', 'EXTERNAL', 'CUSTOM'];

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
    OTHER: []
};

export const CATEGORY_MAP: Record<string, string[]> = {
    SUBSCRIBERS: ['subscriber', 'member', 'follow', 'participant', 'reader', 'подписчики', 'подписчик', 'участники', 'участник', 'фолловер'],
    VIEWS: ['view', 'eye', 'watch', 'stream', 'просмотр', 'гляделок', 'глаз', 'посещен', 'охват', 'стат', 'visit', 'reach', 'stat', 'impressions'],
    BOTS: ['bot', 'бот'],
    LIKES: ['like', 'fav', 'heart', 'лайк', 'сердечк', 'классы', 'мне нравится', 'сохр', 'save'],
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
    /**
     * Synchronous version of detection for use in legacy wrappers or client components.
     */
    static detectSync(name: string, description: string = '', categoryInput: string = '', dynamicPlatforms?: Array<{ slug: string, keywords: string[], name: string }>): AnalyzedService {
        const sanitizedDescription = DescriptionSanitizer.sanitize(description);
        const n = (name + ' ' + sanitizedDescription + ' ' + categoryInput).toLowerCase();

        // 1. Detect Platform
        let platformEnum: Platform = 'OTHER';
        let platformSlug: string = 'other';

        // Priority 1: Dynamic Platforms (from DB)
        let dynamicMatch = false;
        if (dynamicPlatforms && dynamicPlatforms.length > 0) {
            for (const p of dynamicPlatforms) {
                if (p.keywords.some(k => n.includes(k.toLowerCase()))) {
                    platformSlug = p.slug.toLowerCase();
                    dynamicMatch = true;
                    // Try to map to Enum if exists (for legacy compatibility)
                    const upperSlug = p.slug.toUpperCase();
                    if (Object.keys(PLATFORM_KEYWORDS).includes(upperSlug)) {
                        platformEnum = upperSlug as Platform;
                    }
                    break;
                }
            }
        }

        // Priority 2: Hardcoded Platforms (Fallback if no dynamic match)
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

        // Explicit HIGH priority for BOTS (if "бот" is mentioned in NAME or it's a dedicated bot service)
        const nameNode = name.toLowerCase();
        if ((nameNode.includes('бот') || nameNode.includes(' bot')) && !nameNode.includes('подпис') && !nameNode.includes('участник')) {
            category = 'BOTS';
        } else {
            for (const [c, keywords] of Object.entries(CATEGORY_MAP)) {
                if (keywords.some(k => n.includes(k))) {
                    category = c as Category;
                    break;
                }
            }
        }

        const effectivePlatform: string = platformEnum; 

        // VK specific refinement
        if (effectivePlatform === 'VK') {
            if (n.includes('в друзья') || n.includes('на профиль') || n.includes('на страницу')) category = 'FRIENDS';
            else if (n.includes('в группу') || n.includes('в сообщество') || n.includes('паблик')) category = 'GROUPS';
            else if (n.includes('подкаст')) category = 'PLAYS';
            else if (n.includes('прослушиван') || n.includes('плейлист')) category = 'PLAYS';
            else if (n.includes('глазик') || n.includes('на запись') || n.includes('на пост')) category = 'VIEWS';
            else if (n.includes('опрос') || n.includes('голос')) category = 'POLLS';
        }

        // Telegram specific refinement
        if (effectivePlatform === 'TELEGRAM') {
            const nameLower = name.toLowerCase();
            const isSubscriberName = nameLower.includes('подпис') || nameLower.includes('участник') || nameLower.includes('member') || nameLower.includes('subscriber');
            const isStoryName = nameLower.includes('истори') || nameLower.includes('story') || nameLower.includes('stories');
            const isPostName = nameLower.includes('просмотр') || nameLower.includes('реакци') || nameLower.includes('view') || nameLower.includes('reaction');
            const isBotName = nameLower.includes('бот') || nameLower.includes(' bot') || nameLower.includes('запуск') || nameLower.includes('старт');
            const isStars = nameLower.includes('stars') || nameLower.includes('звезд') || (categoryInput.toLowerCase().includes('stars'));
            const isBoost = nameLower.includes('буст') || nameLower.includes('boost');

            if (isStars) {
                category = 'STARS';
            } else if (isBoost) {
                category = 'BOOSTS';
            } else if (isStoryName) {
                category = 'STORIES';
            } else if (isSubscriberName) {
                category = 'SUBSCRIBERS';
            } else if (isPostName) {
                category = nameLower.includes('реакци') || nameLower.includes('reaction') ? 'REACTIONS' : 'VIEWS';
            } else if (isBotName && !nameLower.includes('быстрый')) {
                category = 'BOTS';
            } else {
                // Fallback to full string analysis if name is ambiguous
                const isBotKeywords = (n.includes('старт') || n.includes('запуск') || n.includes('start')) && !n.includes('быстрый старт') && !n.includes('быстрый запуск');
                const isActuallyBot = isBotKeywords || n.includes(' бот') || n.includes(' bot');
                const isPostType = n.includes('просмотр') || n.includes('реакци') || n.includes('view') || n.includes('reaction');
                const isSubscriberType = n.includes('подпис') || n.includes('участник') || n.includes('member') || n.includes('subscriber');
                const isStoryType = n.includes('истори') || n.includes('story') || n.includes('stories');

                if (isStoryType) category = 'STORIES';
                else if (isSubscriberType) category = 'SUBSCRIBERS';
                else if (isPostType) category = n.includes('реакци') || n.includes('reaction') ? 'REACTIONS' : 'VIEWS';
                else if (isActuallyBot) category = 'BOTS';
            }
        }

        // YouTube specific refinement
        if (effectivePlatform === 'YOUTUBE') {
            if (n.includes('час') || n.includes('hour')) category = 'WATCH_TIME';
        }

        // Instagram specific refinement
        if (effectivePlatform === 'INSTAGRAM') {
            const nameLower = name.toLowerCase();
            const nLower = n.toLowerCase();

            // 1. Name-First Priority (more accurate for mixed categories)
            if (nameLower.includes('story') || nameLower.includes('сторис') || nameLower.includes('истори')) {
                category = 'STORIES';
            } else if (nameLower.includes('подпис') || nameLower.includes('subscriber') || nameLower.includes('фолловер')) {
                category = 'SUBSCRIBERS';
            } else if (nameLower.includes('лайк') || nameLower.includes('like')) {
                category = 'LIKES';
            } else if (nameLower.includes('поделиться') || nameLower.includes('share')) {
                category = 'REPOSTS';
            } else if (nameLower.includes('сохран') || nameLower.includes('save')) {
                category = 'SAVES';
            } else if (nameLower.includes('коммент') || nameLower.includes('comment')) {
                category = 'COMMENTS';
            } else if (nameLower.includes('просмотр') || nameLower.includes('view') || nameLower.includes('reel')) {
                category = 'VIEWS';
            }
            // 2. Full Search Fallback (if name is generic)
            else if (nLower.includes('story') || nLower.includes('сторис') || nLower.includes('истори')) {
                category = 'STORIES';
            } else if (nLower.includes('подпис') || nLower.includes('subscriber') || nLower.includes('фолловер')) {
                category = 'SUBSCRIBERS';
            } else if (nLower.includes('лайк') || nLower.includes('like')) {
                category = 'LIKES';
            } else if (nLower.includes('поделиться') || nLower.includes('share')) {
                category = 'REPOSTS';
            } else if (nLower.includes('сохран') || nLower.includes('save')) {
                category = 'SAVES';
            } else if (nLower.includes('коммент') || nLower.includes('comment')) {
                category = 'COMMENTS';
            } else if (nLower.includes('просмотр') || nLower.includes('view') || nLower.includes('reel')) {
                category = 'VIEWS';
            }
        }

        // TikTok specific refinement
        if (effectivePlatform === 'TIKTOK') {
            if (n.includes('share') || n.includes('поделиться')) category = 'REPOSTS';
            if (n.includes('save') || n.includes('сохран')) category = 'SAVES';
        }

        // Twitter specific refinement
        if (effectivePlatform === 'TWITTER') {
            if (n.includes('retweet') || n.includes('ретвит')) category = 'REPOSTS';
        }

        // 3. Target Type
        let targetType = 'POST';
        const isPrivate = n.includes('private') || n.includes('priv ') || n.includes('закрыт') || n.includes('приват') || n.includes('канал c') || n.includes('для закрытых');
        const isAuto = n.includes('auto') || n.includes('subscription') || n.includes('авто') || n.includes('последних постов') || n.includes('будущие');

        if (effectivePlatform === 'TELEGRAM') {
            if ((category as string) === 'STARS') targetType = 'CUSTOM';
            else if ((category as string) === 'BOTS' || (category as string) === 'REFERRALS') targetType = 'CHANNEL';
            else if (category === 'STORIES') targetType = 'STORY';
            else if (category === 'BOOSTS') targetType = 'CHANNEL';
            else if (isAuto) targetType = 'CHANNEL_POSTS';
            else if (['VIEWS', 'REACTIONS', 'REPOSTS', 'COMMENTS'].includes(category)) targetType = 'POST';
            else if (['SUBSCRIBERS', 'GROUPS'].includes(category)) targetType = 'CHANNEL';
            else targetType = 'CHANNEL';
        } else if (effectivePlatform === 'INSTAGRAM') {
            if (isAuto) targetType = 'CHANNEL_POSTS';
            else if (category === 'SUBSCRIBERS') targetType = 'PROFILE';
            else if (category === 'STORIES') targetType = 'STORY';
            else if (n.includes('reel') || n.includes('video') || n.includes('видео') || n.includes(' igtv')) targetType = 'VIDEO';
            else targetType = 'POST';
        } else if (effectivePlatform === 'VK') {
            if (isAuto) targetType = 'CHANNEL_POSTS';
            else if (n.includes('vk play') || n.includes('play') || n.includes('stream') || n.includes('стрим') || n.includes('зрител')) {
                const isSubValue = n.includes('подпис') || n.includes('sub') || n.includes('follow') || category === 'SUBSCRIBERS';
                targetType = isSubValue ? 'CHANNEL' : 'VIDEO';
            } else if (n.includes('poll') || n.includes('опрос') || n.includes('голос')) targetType = 'POLL';
            else if (['FRIENDS', 'SUBSCRIBERS'].includes(category) && (n.includes('профиль') || n.includes('друзья'))) targetType = 'PROFILE';
            else if (['GROUPS', 'SUBSCRIBERS'].includes(category)) targetType = 'CHANNEL';
            else if (n.includes('video') || n.includes('clip') || n.includes('клип') || n.includes('видео') || (category as string) === 'VIEWS') {
                targetType = (n.includes('clip') || n.includes('клип')) ? 'VK_CLIP' : 'VK_VIDEO';
            } else if (category === 'STORIES') targetType = 'STORY';
            else if (n.includes('wall') || n.includes('стен') || n.includes('пост') || n.includes('запись')) targetType = 'POST';
            else targetType = 'CHANNEL';
        } else {
            // Generic logic for other platforms
            if (isAuto) {
                targetType = 'CHANNEL_POSTS';
            } else if (['SUBSCRIBERS', 'GROUPS', 'FRIENDS'].includes(category)) {
                targetType = (['INSTAGRAM', 'TIKTOK'].includes(effectivePlatform)) ? 'PROFILE' : 'CHANNEL';
            } else if (n.includes('video') || n.includes('reel') || n.includes('shorts') || (category as string) === 'VIEWS') {
                targetType = 'VIDEO';
            } else {
                targetType = 'POST';
            }
        }

        // 4. Description
        const isFast = n.includes('fast') || n.includes('instant') || n.includes('быстр') || n.includes('мгновен');
        const isReal = n.includes('real') || n.includes('active') || n.includes('живы') || n.includes('реальн');
        const isNoDrop = n.includes('no drop') || n.includes('non drop') || n.includes('без отписок') || n.includes('гарант');
        const isHQ = n.includes('hq') || n.includes('high quality') || n.includes('высокое качество');

        let sellingDescription = '';
        if (category === 'SUBSCRIBERS' || category === 'GROUPS' || category === 'FRIENDS') {
            const typeLabel = category === 'FRIENDS' ? 'друзья' : (category === 'GROUPS' ? 'участники' : 'подписчики');
            sellingDescription = `### 🚀 Качественные ${typeLabel}
* **Качество**: ${isReal ? 'Живые пользователи' : isHQ ? 'Высокое (HQ)' : 'Стандартные аккаунты'}
* **Скорость**: ${isFast ? 'Мгновенный старт' : 'Плавное добавление'}
* **Гарантия**: ${isNoDrop ? 'От списаний (Refill)' : 'Стабильное выполнение'}
`;
        } else if (category === 'LIKES') {
            sellingDescription = `### ❤️ Лайки на ваши публикации
* **Запуск**: ${isFast ? 'Автоматический (быстрый)' : '10-30 минут'}
* **Тип**: ${isReal ? 'От реальных людей' : 'Качественные профили'}
`;
        } else if (category === 'VIEWS') {
            sellingDescription = `### 👁 Просмотры контента
* **Старт**: Моментальный
* **Удержание**: ${isHQ ? 'Максимальное' : 'Стандартное'}
`;
        } else if (category === 'REACTIONS') {
            sellingDescription = `### 🎭 Реакции (Эмодзи)
* **Тип**: ${n.includes('random') ? 'Случайные положительные' : 'Выбранные вами'}
* **Скорость**: Мгновенное распределение
* **Эффект**: Повышает доверие и охваты поста
`;
        } else if (category === 'COMMENTS') {
            sellingDescription = `### 💬 Комментарии и Отзывы
* **Тип**: ${n.includes('custom') ? 'Ваш собственный текст' : 'Релевантные положительные'}
* **Язык**: Русский / Английский
* **Безопасность**: Естественные интервалы публикации
`;
        } else if (category === 'REPOSTS') {
            sellingDescription = `### 📢 Репосты и Поделиться
* **Охват**: Позволяет попасть в рекомендации
* **Качество**: Реальные аккаунты
* **Старт**: От 5 до 20 минут
`;
        } else {
            const platformName = dynamicMatch && dynamicPlatforms
                ? dynamicPlatforms.find(p => p.slug.toLowerCase() === platformSlug)?.name || platformSlug
                : PLATFORM_LABELS[effectivePlatform] || effectivePlatform;

            sellingDescription = (sanitizedDescription && sanitizedDescription.length > 10)
                ? sanitizedDescription
                : `### ✨ Услуга для ${platformName}
Продвижение вашего проекта с гарантией качества и быстрой скоростью выполнения.`;
        }

        // 5. Suggested Name
        let suggestedName = name;
        suggestedName = suggestedName.replace(/\[.*?\]/g, '').replace(/ID\d+/gi, '').replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim();

        if (isHQ && !suggestedName.toLowerCase().includes('hq')) suggestedName += ' [HQ]';
        if (isReal && !suggestedName.toLowerCase().includes('живые')) suggestedName += ' [Живые]';

        // 6. Detect Requirements (Bot Admin, etc.)
        let requirements: string | undefined = undefined;

        // Instagram specific requirements
        if (effectivePlatform === 'INSTAGRAM') {
            const reqs = [];
            if (n.includes('публичн') || n.includes('открыт') || n.includes('public')) {
                reqs.push("Профиль/Пост должен быть открытым (публичным).");
            }
            if (n.includes('ссылку на профиль') || n.includes('ссылка на профиль')) {
                reqs.push("Указывать ссылку на профиль.");
            } else if (n.includes('ссылку на пост') || n.includes('ссылка на пост') || n.includes('ссылку на публикацию')) {
                reqs.push("Указывать ссылку на конкретную публикацию.");
            }
            if (n.includes('не подходит для рилсов') || n.includes('not for reels')) {
                reqs.push("Не подходит для Reels.");
            }
            if (n.includes('галочка') || n.includes('проверк')) {
                // Special check for verification requirements
                if (n.includes('открытый профиль')) reqs.push("Профиль должен быть открыт.");
            }

            if (reqs.length > 0) requirements = reqs.join(" ");
        }

        // Search for bot mentions in administrative context
        const botMatch = n.match(/(@[a-z0-9_]+bot)/i);
        const hasAdminKeywords = n.includes('админ') || n.includes('добавьте') || n.includes('назнач') || n.includes('права');

        if (botMatch && hasAdminKeywords) {
            requirements = `Для работы услуги необходимо добавить бота ${botMatch[0]} в администраторы вашего канала/группы с правами на сообщения/репосты.`;
        } else if (isPrivate && (n.includes('бота') || n.includes('админ'))) {
            requirements = "Для работы в закрытом канале необходимо добавить сервисного бота провайдера в администраторы.";
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


