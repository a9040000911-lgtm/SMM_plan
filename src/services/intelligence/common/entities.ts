export enum IntelligencePlatform {
    YOUTUBE = 'YOUTUBE',
    INSTAGRAM = 'INSTAGRAM',
    TIKTOK = 'TIKTOK',
    TELEGRAM = 'TELEGRAM',
    FACEBOOK = 'FACEBOOK',
    TWITTER = 'TWITTER',
    VK = 'VK',
    OK = 'OK',
    TWITCH = 'TWITCH',
    RUTUBE = 'RUTUBE',
    LIKEE = 'LIKEE',
    WEBSITE = 'WEBSITE',
    OTHER = 'OTHER',
}

export interface IntelligenceLinkMetadata {
    isLive?: boolean;
    context?: string;
    [key: string]: any;
}

export interface AnalyzedIntelligenceLink {
    url: string;
    platform: IntelligencePlatform;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, any>;
}


