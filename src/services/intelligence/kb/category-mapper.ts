import { IntelligencePlatform } from '../common/entities';

export interface CategoryMapping {
    category: string;
    keywords: string[];
    triggers?: string[];
}

export const CATEGORY_MAPPINGS: Record<string, CategoryMapping[]> = {
    [IntelligencePlatform.YOUTUBE]: [
        { category: 'VIEWS', keywords: ['views', 'просмотры'], triggers: ['hits', 'plays', 'retention'] },
        { category: 'FOLLOWERS', keywords: ['subscribers', 'subs', 'подписчики'], triggers: ['members'] },
        { category: 'LIKES', keywords: ['likes', 'лайки'], triggers: ['reactions'] },
        { category: 'WATCH_TIME', keywords: ['watch time', '4000h', 'часы просмотра'], triggers: ['hours'] }
    ],
    [IntelligencePlatform.INSTAGRAM]: [
        { category: 'FOLLOWERS', keywords: ['followers', 'подписчики'], triggers: ['subs', 'profiles'] },
        { category: 'LIKES', keywords: ['likes', 'лайки'], triggers: ['hearts', 'favs'] },
        { category: 'VIEWS', keywords: ['views', 'просмотры', 'reels'], triggers: ['impressions', 'reach'] },
        { category: 'SHARES', keywords: ['shares', 'репосты'], triggers: ['dm', 'send'] }
    ],
    [IntelligencePlatform.TELEGRAM]: [
        { category: 'FOLLOWERS', keywords: ['members', 'subs', 'подписчики'], triggers: ['adds', 'joins'] },
        { category: 'VIEWS', keywords: ['views', 'просмотры'], triggers: ['post views'] },
        { category: 'REACTIONS', keywords: ['reactions', 'реакции'], triggers: ['premium', 'stars'] }
    ],
    [IntelligencePlatform.WEBSITE]: [
        { category: 'TRAFFIC_ORGANIC', keywords: ['organic', 'search', 'google'], triggers: ['keyword', 'targeted'] },
        { category: 'TRAFFIC_DIRECT', keywords: ['direct', 'traffic', 'hits'], triggers: ['bulk', 'cheap'] }
    ]
};
