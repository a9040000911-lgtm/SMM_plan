/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

export const Platform = {
    TELEGRAM: 'TELEGRAM',
    VK: 'VK',
    INSTAGRAM: 'INSTAGRAM',
    TWITCH: 'TWITCH',
    YOUTUBE: 'YOUTUBE',
    TIKTOK: 'TIKTOK',
    LIKEE: 'LIKEE',
    DISCORD: 'DISCORD',
    FACEBOOK: 'FACEBOOK',
    DZEN: 'DZEN',
    OTHER: 'OTHER'
} as const;

export type Platform = typeof Platform[keyof typeof Platform];

export const Category = {
    VIEWS: 'VIEWS',
    SUBSCRIBERS: 'SUBSCRIBERS',
    LIKES: 'LIKES',
    REACTIONS: 'REACTIONS',
    COMMENTS: 'COMMENTS',
    BOOSTS: 'BOOSTS',
    SAVES: 'SAVES',
    POLLS: 'POLLS',
    DISLIKES: 'DISLIKES',
    REPOSTS: 'REPOSTS',
    GROUPS: 'GROUPS',
    FRIENDS: 'FRIENDS',
    PLAYS: 'PLAYS',
    BOTS: 'BOTS',
    STORIES: 'STORIES',
    COMPLAINTS: 'COMPLAINTS',
    REFERRALS: 'REFERRALS',
    WATCH_TIME: 'WATCH_TIME',
    STARS: 'STARS',
    RECOVER: 'RECOVER',
    PREMIUM: 'PREMIUM',
    TRAFFIC: 'TRAFFIC',
    STREAMS: 'STREAMS',
    OTHER: 'OTHER'
} as const;

export type Category = typeof Category[keyof typeof Category];
