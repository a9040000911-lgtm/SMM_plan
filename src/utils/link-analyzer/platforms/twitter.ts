/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { AnalysisResult, PlatformParser } from '../types';

export const TwitterParser: PlatformParser = {
    name: Platform.TWITTER,
    domains: ['x.com', 'twitter.com'],
    parse(url: string): AnalysisResult | null {
        if (url.includes('/status/') || url.includes('/statuses/')) {
            return {
                platform: Platform.TWITTER,
                possibleCategories: [Category.LIKES, Category.REPOSTS, Category.VIEWS, Category.COMMENTS],
                objectType: 'X_POST'
            };
        }
        return {
            platform: Platform.TWITTER,
            possibleCategories: [Category.SUBSCRIBERS],
            objectType: 'X_PROFILE'
        };
    }
};
