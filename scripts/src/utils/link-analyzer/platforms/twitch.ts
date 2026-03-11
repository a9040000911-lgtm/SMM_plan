/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { AnalysisResult, PlatformParser } from '../types';

export const TwitchParser: PlatformParser = {
    name: Platform.TWITCH,
    domains: ['twitch.tv'],
    parse(url: string): AnalysisResult | null {
        if (url.includes('/videos/')) return { platform: Platform.TWITCH, possibleCategories: [Category.VIEWS], objectType: 'TW_VIDEO' };
        if (url.includes('/clip/')) return { platform: Platform.TWITCH, possibleCategories: [Category.VIEWS], objectType: 'TW_CLIP' };

        return {
            platform: Platform.TWITCH,
            possibleCategories: [Category.SUBSCRIBERS, Category.VIEWS],
            objectType: 'TW_CHANNEL',
        };
    }
};
