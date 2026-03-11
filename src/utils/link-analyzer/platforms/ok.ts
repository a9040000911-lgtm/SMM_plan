/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { AnalysisResult, PlatformParser } from '../types';

export const OkParser: PlatformParser = {
    name: Platform.OK,
    domains: ['ok.ru', 'odnoklassniki.ru'],
    parse(url: string): AnalysisResult | null {
        const isPrivate = url.includes('?st.invite=');

        if (url.includes('/group/') || url.includes('/club')) {
            return { platform: Platform.OK, possibleCategories: [Category.SUBSCRIBERS, Category.GROUPS], objectType: 'OK_GROUP', isPrivate };
        }
        if (url.includes('/video/')) return { platform: Platform.OK, possibleCategories: [Category.VIEWS, Category.COMMENTS, Category.REACTIONS], objectType: 'OK_VIDEO', isPrivate };
        if (url.includes('/photo/')) return { platform: Platform.OK, possibleCategories: [Category.REACTIONS, Category.COMMENTS], objectType: 'OK_PHOTO', isPrivate };
        if (url.includes('/topic/') || url.includes('/statuses/')) return { platform: Platform.OK, possibleCategories: [Category.REACTIONS, Category.COMMENTS, Category.REPOSTS], objectType: 'OK_POST', isPrivate };

        return {
            platform: Platform.OK,
            possibleCategories: [Category.SUBSCRIBERS, Category.FRIENDS],
            objectType: 'OK_PROFILE',
            isPrivate
        };
    }
};
