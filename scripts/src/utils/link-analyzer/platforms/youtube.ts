/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { PlatformParser, AnalysisResult } from '../types';

export const YoutubeParser: PlatformParser = {
    name: Platform.YOUTUBE,
    domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com', 'm.youtube.com'],
    parse(url: string): AnalysisResult | null {
        if (url.includes('/shorts/')) {
            return { platform: Platform.YOUTUBE, possibleCategories: [Category.VIEWS, Category.LIKES, Category.REPOSTS, Category.COMMENTS], objectType: 'YT_SHORT' };
        }
        if (url.includes('/live') || url.includes('/c/') || url.includes('/channel/') || url.includes('/user/') || url.includes('@')) {
            if (url.includes('/live')) return { platform: Platform.YOUTUBE, possibleCategories: [Category.VIEWS, Category.LIKES, Category.COMMENTS], objectType: 'YT_LIVE' };
            return { platform: Platform.YOUTUBE, possibleCategories: [Category.SUBSCRIBERS, Category.WATCH_TIME], objectType: 'YT_CHANNEL' };
        }
        if (url.includes('playlist')) {
            return { platform: Platform.YOUTUBE, possibleCategories: [Category.VIEWS], objectType: 'YT_PLAYLIST' };
        }
        if (url.includes('watch') || url.includes('youtu.be')) {
            return { platform: Platform.YOUTUBE, possibleCategories: [Category.VIEWS, Category.LIKES, Category.REPOSTS, Category.COMMENTS, Category.WATCH_TIME], objectType: 'YT_VIDEO' };
        }
        return { platform: Platform.YOUTUBE, possibleCategories: [Category.SUBSCRIBERS], objectType: 'YT_CHANNEL' };
    }
};
