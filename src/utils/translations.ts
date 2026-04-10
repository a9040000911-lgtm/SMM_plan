/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const CATEGORY_TRANSLATIONS: Record<string, string> = {
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

export const PLATFORM_TRANSLATIONS: Record<string, string> = {
    TELEGRAM: 'Telegram',
    INSTAGRAM: 'Instagram',
    VK: 'ВКонтакте',
    TIKTOK: 'TikTok',
    YOUTUBE: 'YouTube',
    FACEBOOK: 'Facebook',
    TWITTER: 'Twitter',
    MAX: 'Max',
    DISCORD: 'Discord',
    THREADS: 'Threads',
    REDDIT: 'Reddit',
    TWITCH: 'Twitch',
    KICK: 'Kick',
    RUTUBE: 'Rutube',
    DZEN: 'Дзен',
    MUSIC: 'Музыка',
    OK: 'Одноклассники',
    LIKEE: 'Likee',
    WHATSAPP: 'WhatsApp',
    SPOTIFY: 'Spotify',
    SOUNDCLOUD: 'SoundCloud',
    STEAM: 'Steam',
    GOOGLE: 'Google',
    TROVO: 'Trovo',
    YANDEX: 'Яндекс',
    WEBSITE: 'Web-сайт',
    VKONTAKTE: 'ВКонтакте',
    ODNOKLASSNIKI: 'Одноклассники',
    'TWITTER-X': 'Twitter (X)'
};

export function translateCategory(category: string): string {
    return CATEGORY_TRANSLATIONS[category.toUpperCase()] || category;
}

export function translatePlatform(platform: string): string {
    return PLATFORM_TRANSLATIONS[platform.toUpperCase()] || platform;
}

export function translateTargetType(type: string): string {
    const map: Record<string, string> = {
        CHANNEL: 'Канал',
        POST: 'Пост',
        PROFILE: 'Профиль',
        VIDEO: 'Видео',
        REEL: 'Reels',
        CLIP: 'Клип',
        STORY: 'История',
        POLL: 'Опрос',
        GROUP: 'Группа'
    };
    return map[type.toUpperCase()] || type;
}


