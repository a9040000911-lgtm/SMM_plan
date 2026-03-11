/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { PlatformParser, AnalysisResult } from '../types';

export const TiktokParser: PlatformParser = {
    name: Platform.TIKTOK,
    domains: ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
    parse(url: string): AnalysisResult | null {
        if (url.includes('/video/') || url.includes('/t/')) {
            return { platform: Platform.TIKTOK, possibleCategories: [Category.VIEWS, Category.LIKES, Category.REPOSTS, Category.COMMENTS, Category.SAVES], objectType: 'TT_VIDEO' };
        }
        return { platform: Platform.TIKTOK, possibleCategories: [Category.SUBSCRIBERS], objectType: 'TT_PROFILE' };
    }
};
