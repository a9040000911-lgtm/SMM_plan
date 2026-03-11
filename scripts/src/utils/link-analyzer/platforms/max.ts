/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { AnalysisResult, PlatformParser } from '../types';

export const MaxParser: PlatformParser = {
    name: Platform.MAX,
    domains: ['max.ru', 'max.app', 't.max.ru', 'max.im'],
    parse(url: string): AnalysisResult | null {
        const isPrivate = url.includes('/join/') || url.includes('?invite=');

        if (url.includes('/join/') || url.includes('?invite=')) {
            return { platform: Platform.MAX, possibleCategories: [Category.SUBSCRIBERS, Category.GROUPS], objectType: 'MAX_GROUP', isPrivate: true };
        }

        if (url.includes('start=')) return { platform: Platform.MAX, possibleCategories: [Category.BOTS], objectType: 'MAX_BOT' };

        const urlParts = url.split('?')[0].split('/');
        const lastPart = urlParts[urlParts.length - 1];

        if (/^\d+$/.test(lastPart)) {
            return {
                platform: Platform.MAX,
                possibleCategories: [Category.VIEWS, Category.REACTIONS, Category.REPOSTS, Category.COMMENTS],
                objectType: 'MAX_POST',
                isPrivate
            };
        }

        return {
            platform: Platform.MAX,
            possibleCategories: [Category.SUBSCRIBERS, Category.GROUPS, Category.VIEWS, Category.REACTIONS],
            objectType: 'MAX_CHANNEL',
            isPrivate
        };
    }
};
