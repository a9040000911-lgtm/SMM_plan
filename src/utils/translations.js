"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_TRANSLATIONS = exports.CATEGORY_TRANSLATIONS = void 0;
exports.translateCategory = translateCategory;
exports.translatePlatform = translatePlatform;
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
exports.CATEGORY_TRANSLATIONS = {
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
exports.PLATFORM_TRANSLATIONS = {
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
};
function translateCategory(category) {
    return exports.CATEGORY_TRANSLATIONS[category.toUpperCase()] || category;
}
function translatePlatform(platform) {
    return exports.PLATFORM_TRANSLATIONS[platform.toUpperCase()] || platform;
}
