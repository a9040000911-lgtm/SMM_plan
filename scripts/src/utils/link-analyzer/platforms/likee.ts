/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { AnalysisResult, PlatformParser } from '../types';

export const LikeeParser: PlatformParser = {
    name: Platform.LIKEE,
    domains: ['likee.video', 'likee.com'],
    parse(url: string): AnalysisResult | null {
        if (url.includes('/video/') || url.includes('/v/')) {
            return {
                platform: Platform.LIKEE,
                possibleCategories: [Category.LIKES, Category.VIEWS, Category.REPOSTS, Category.COMMENTS],
                objectType: 'LKE_VIDEO'
            };
        }
        return {
            platform: Platform.LIKEE,
            possibleCategories: [Category.SUBSCRIBERS],
            objectType: 'LKE_PROFILE'
        };
    }
};
