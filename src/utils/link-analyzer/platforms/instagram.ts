/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { AnalysisResult, PlatformParser } from '../types';

export const InstagramParser: PlatformParser = {
  name: Platform.INSTAGRAM,
  domains: ['instagram.com'],
  parse(url: string): AnalysisResult | null {
    if (url.includes('/p/') || url.includes('/tv/')) {
      return { platform: Platform.INSTAGRAM, possibleCategories: [Category.LIKES, Category.VIEWS, Category.REPOSTS, Category.COMMENTS], objectType: 'IG_POST' };
    }
    if (url.includes('/reel/')) return { platform: Platform.INSTAGRAM, possibleCategories: [Category.LIKES, Category.VIEWS, Category.REPOSTS, Category.COMMENTS], objectType: 'IG_REEL' };
    if (url.includes('/stories/highlights/')) return { platform: Platform.INSTAGRAM, possibleCategories: [Category.VIEWS], objectType: 'IG_HIGHLIGHT' };
    if (url.includes('/stories/')) return { platform: Platform.INSTAGRAM, possibleCategories: [Category.VIEWS], objectType: 'IG_STORY' };
    if (url.includes('/guides/')) return { platform: Platform.INSTAGRAM, possibleCategories: [Category.VIEWS, Category.LIKES], objectType: 'IG_GUIDE' };
    if (url.includes('/ar/')) return { platform: Platform.INSTAGRAM, possibleCategories: [Category.VIEWS], objectType: 'IG_EFFECT' };
    if (url.includes('/reels/audio/') || url.includes('/music/')) return { platform: Platform.INSTAGRAM, possibleCategories: [Category.VIEWS, Category.LIKES], objectType: 'IG_AUDIO' };
    return { platform: Platform.INSTAGRAM, possibleCategories: [Category.SUBSCRIBERS], objectType: 'IG_PROFILE' };
  }
};
