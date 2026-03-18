/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

export const PLATFORM_SHORTS: Record<string, string> = {
    TELEGRAM: 'TG',
    INSTAGRAM: 'IG',
    TIKTOK: 'TT',
    YOUTUBE: 'YT',
    VK: 'VK',
    TWITCH: 'TTV',
    DISCORD: 'DS',
    TWITTER: 'X',
    FACEBOOK: 'FB',
    THREADS: 'THR',
    REDDIT: 'RED',
    RUTUBE: 'RU',
    DZEN: 'DZEN',
    MUSIC: 'MUS',
    OK: 'OK',
    LIKEE: 'LIKE',
    WHATSAPP: 'WA',
    SPOTIFY: 'SPOT',
    SOUNDCLOUD: 'SC',
    LINKEDIN: 'IN',
    PINTEREST: 'PIN',
    SNAPCHAT: 'SNAP',
    TROVO: 'TRV',
    KWAI: 'KW',
    MESSENGER_MAX: 'MAX'
};

export const CATEGORY_SHORTS: Record<string, string> = {
    SUBSCRIBERS: 'SUB',
    LIKES: 'LIKE',
    VIEWS: 'VIEW',
    REACTIONS: 'REAC',
    REPOSTS: 'REP',
    COMMENTS: 'COMM',
    OTHER: 'OTH',
    BOOSTS: 'BST',
    POLLS: 'POLL',
    STORIES: 'STR',
    BOTS: 'BOT',
    REFERRALS: 'REF',
    FRIENDS: 'FRD',
    PLAYS: 'PLAY',
    RECOVER: 'REC',
    PREMIUM: 'PREM',
    TRAFFIC: 'TRF',
    DISLIKES: 'DIS',
    GROUPS: 'GRP',
    STREAMS: 'STRM'
};

/**
 * Генерирует компактный ID услуги в формате PLATFORM_SKU
 */
export function formatServiceId(platform: string, category: string, id: number | string): string {
    const p = PLATFORM_SHORTS[platform?.toUpperCase()] || platform?.substring(0, 3).toUpperCase() || 'UNK';

    const idStr = id.toString();
    const parts = idStr.split('_');
    const cleanId = parts[parts.length - 1]; // Берем последнюю часть (часто это SKU)

    return `${p}_${cleanId}`.toUpperCase();
}


