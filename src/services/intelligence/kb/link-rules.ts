import { IntelligencePlatform } from '../common/entities';

export interface LinkRule {
    platform: IntelligencePlatform;
    type: string;
    pattern: RegExp;
    suggestedCategories: string[];
    context?: string;
}

export const LINK_RULES: LinkRule[] = [
    {
        platform: IntelligencePlatform.YOUTUBE,
        type: 'video',
        pattern: /(?:v=|be\/|shorts\/|embed\/)([\w-]{6,12})/,
        suggestedCategories: ['VIEWS', 'LIKES', 'REVIEWS', 'SEO_BOOST'],
        context: 'high_retention_target'
    },
    {
        platform: IntelligencePlatform.YOUTUBE,
        type: 'channel',
        pattern: /youtube\.com\/(?:@|channel\/|user\/)([\w-.]+)/,
        suggestedCategories: ['FOLLOWERS', 'CHANNEL_AUDIT'],
        context: 'authority_growth'
    },
    {
        platform: IntelligencePlatform.INSTAGRAM,
        type: 'post',
        pattern: /instagram\.com\/(?:p|reel|tv)\/([\w-]+)/,
        suggestedCategories: ['LIKES', 'SAVES', 'REELS_SHARES', 'IMPRESSIONS'],
        context: 'viral_momentum'
    },
    {
        platform: IntelligencePlatform.INSTAGRAM,
        type: 'profile',
        pattern: /(?:instagram\.com|ig\.me)\/([\w._]+)/,
        suggestedCategories: ['FOLLOWERS', 'STORY_VIEWS', 'PROFILE_VISITS'],
        context: 'trust_building'
    },
    {
        platform: IntelligencePlatform.TELEGRAM,
        type: 'channel',
        pattern: /t\.me\/(?:joinchat\/|\+)?([\w_-]+)$/,
        suggestedCategories: ['FOLLOWERS', 'VIEWS', 'REACTIONS_PREMIUM'],
        context: 'global_search_optimization'
    },
    {
        platform: IntelligencePlatform.TELEGRAM,
        type: 'post',
        pattern: /t\.me\/[\w_-]+\/(\d+)/,
        suggestedCategories: ['VIEWS', 'REACTIONS'],
        context: 'engagement'
    },
    {
        platform: IntelligencePlatform.TELEGRAM,
        type: 'bot',
        pattern: /t\.me\/(?:[\w_-]+bot|[\w_-]+_bot)/,
        suggestedCategories: ['BOT_START', 'BOT_FEATURES'],
        context: 'automation'
    },
    {
        platform: IntelligencePlatform.TIKTOK,
        type: 'short_link',
        pattern: /(?:vm|vt)\.tiktok\.com\/([\w-]+)/,
        suggestedCategories: ['VIEWS', 'LIKES', 'SHARES'],
        context: 'mobile_viral'
    },
    {
        platform: IntelligencePlatform.VK,
        type: 'post',
        pattern: /vk\.(?:com|ru)\/(?:wall|clip|video)(-?\d+_\d+)/,
        suggestedCategories: ['LIKES', 'REPOSTS', 'VIEWS'],
        context: 'social_reach'
    },
    {
        platform: IntelligencePlatform.VK,
        type: 'profile',
        pattern: /vk\.(?:com|ru)\/([\w._]+)/,
        suggestedCategories: ['FOLLOWERS', 'FRIENDS'],
        context: 'networking'
    },
    {
        platform: IntelligencePlatform.TWITCH,
        type: 'channel',
        pattern: /twitch\.tv\/([\w]+)/,
        suggestedCategories: ['FOLLOWERS', 'VIEWS', 'LIVE_VIEWERS'],
        context: 'streaming_growth'
    },
    {
        platform: IntelligencePlatform.TWITTER,
        type: 'profile',
        pattern: /(?:twitter\.com|x\.com)\/([\w]+)/,
        suggestedCategories: ['FOLLOWERS', 'RETWEETS', 'LIKES'],
        context: 'social_presence'
    },
    {
        platform: IntelligencePlatform.TIKTOK,
        type: 'video',
        pattern: /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
        suggestedCategories: ['VIEWS', 'LIKES', 'SHARES'],
        context: 'viral_reach'
    },
    {
        platform: IntelligencePlatform.TIKTOK,
        type: 'profile',
        pattern: /tiktok\.com\/(@[\w.]+)/,
        suggestedCategories: ['FOLLOWERS', 'BATTLE_LIKES'],
        context: 'influence'
    },
    {
        platform: IntelligencePlatform.WEBSITE,
        type: 'seo_traffic',
        pattern: /[^:]+:[^ \n]+$/,
        suggestedCategories: ['TRAFFIC_ORGANIC', 'TRAFFIC_KEYWORDS'],
        context: 'seo_authority'
    },
    {
        platform: IntelligencePlatform.WEBSITE,
        type: 'direct_traffic',
        pattern: /^https?:\/\//,
        suggestedCategories: ['TRAFFIC_DIRECT', 'SOCIAL_SIGNALS'],
        context: 'visibility'
    }
];


