/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export type TargetType = 'CHANNEL' | 'POST' | 'PROFILE' | 'GROUP' | 'STORY' | 'COMMENT' | 'VIDEO' | 'REEL' | 'OTHER';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    detectedType?: TargetType;
}

const PATTERNS: Record<string, Record<TargetType, RegExp>> = {
    TELEGRAM: {
        CHANNEL: /(t\.me\/|telegram\.me\/)([a-zA-Z0-9_]{5,})$/,
        POST: /(t\.me\/|telegram\.me\/)([a-zA-Z0-9_]{5,})\/(\d+)$/,
        PROFILE: /(t\.me\/|telegram\.me\/)([a-zA-Z0-9_]{5,})$/, // Usually the same as channel
        GROUP: /(t\.me\/|telegram\.me\/)([a-zA-Z0-9_]{5,})$/,
        VIDEO: /(t\.me\/|telegram\.me\/)([a-zA-Z0-9_]{5,})\/(\d+)$/,
        STORY: /(t\.me\/|telegram\.me\/)s\/([a-zA-Z0-9_]{5,})\/(\d+)$/,
        COMMENT: /.*/, // Complex
        REEL: /.*/,
        OTHER: /.*/
    },
    INSTAGRAM: {
        PROFILE: /(instagram\.com\/)([a-zA-Z0-9._]{1,30})\/?$/,
        POST: /(instagram\.com\/)(p|tv|reels|reel)\/([a-zA-Z0-9_-]+)\/?$/,
        REEL: /(instagram\.com\/)(reels|reel)\/([a-zA-Z0-9_-]+)\/?$/,
        STORY: /(instagram\.com\/)stories\/([a-zA-Z0-9._]{1,30})\/(\d+)\/?$/,
        CHANNEL: /.*/,
        GROUP: /.*/,
        VIDEO: /(instagram\.com\/)(p|tv|reels|reel)\/([a-zA-Z0-9_-]+)\/?$/,
        COMMENT: /.*/,
        OTHER: /.*/
    },
    TIKTOK: {
        PROFILE: /(tiktok\.com\/)@([a-zA-Z0-9._-]{2,30})\/?$/,
        POST: /(tiktok\.com\/)@([a-zA-Z0-9._-]{2,30})\/video\/(\d+)/,
        VIDEO: /(tiktok\.com\/)@([a-zA-Z0-9._-]{2,30})\/video\/(\d+)/,
        CHANNEL: /.*/,
        GROUP: /.*/,
        STORY: /.*/,
        COMMENT: /.*/,
        REEL: /.*/,
        OTHER: /.*/
    },
    YOUTUBE: {
        CHANNEL: /(youtube\.com\/)(channel|c|user|@)([a-zA-Z0-9_-]+)/,
        VIDEO: /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        POST: /.*/,
        GROUP: /.*/,
        PROFILE: /(youtube\.com\/)(@)([a-zA-Z0-9_-]+)/,
        STORY: /.*/,
        COMMENT: /.*/,
        REEL: /(youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        OTHER: /.*/
    }
};

/**
 * Валидирует ссылку на соответствие платформе и типу цели.
 */
export function validateTargetLink(link: string, platform: string, targetType: string): ValidationResult {
    const platKey = platform.toUpperCase();
    const typeKey = targetType.toUpperCase() as TargetType;

    // Default if no pattern
    if (!PATTERNS[platKey] || !PATTERNS[platKey][typeKey]) {
        return { isValid: true }; // Skip validation if no pattern defined
    }

    const pattern = PATTERNS[platKey][typeKey];
    const isValid = pattern.test(link.trim());

    if (!isValid) {
        return {
            isValid: false,
            error: `Ссылка не соответствует формату ${platKey} ${typeKey}.`
        };
    }

    return { isValid: true };
}

/**
 * Пытается определить тип цели по ссылке.
 */
export function autoDetectTargetType(link: string): { platform: string, targetType: TargetType } | null {
    for (const [platform, types] of Object.entries(PATTERNS)) {
        for (const [type, pattern] of Object.entries(types)) {
            if (pattern.source !== '.*' && pattern.test(link.trim())) {
                return { platform, targetType: type as TargetType };
            }
        }
    }
    return null;
}


