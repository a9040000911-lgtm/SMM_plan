/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { AnalysisResult, PlatformParser } from '../types';

export const MusicParser: PlatformParser = {
    name: Platform.MUSIC,
    domains: ['music.yandex.ru', 'music.yandex.com'],
    parse(url: string): AnalysisResult | null {
        if (url.includes('/album/') && url.includes('/track/')) {
            return { platform: Platform.MUSIC, possibleCategories: [Category.PLAYS, Category.REACTIONS], objectType: 'YM_TRACK' as any };
        }
        if (url.includes('/album/')) {
            return { platform: Platform.MUSIC, possibleCategories: [Category.PLAYS], objectType: 'YM_ALBUM' as any };
        }
        if (url.includes('/artist/')) {
            return { platform: Platform.MUSIC, possibleCategories: [Category.SUBSCRIBERS, Category.PLAYS], objectType: 'YM_ARTIST' as any };
        }
        if (url.includes('/users/') && url.includes('/playlists/')) {
            return { platform: Platform.MUSIC, possibleCategories: [Category.PLAYS, Category.REACTIONS], objectType: 'YM_PLAYLIST' as any };
        }

        return {
            platform: Platform.MUSIC,
            possibleCategories: [Category.OTHER],
            objectType: 'UNKNOWN',
        };
    }
};
