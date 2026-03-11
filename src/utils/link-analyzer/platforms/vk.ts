/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { AnalysisResult, PlatformParser } from '../types';

export const VkParser: PlatformParser = {
  name: Platform.VK,
  domains: ['vk.com', 'vk.me', 'vk.ru', 'm.vk.com', 'vkvideo.ru', 'vkplay.live', 'live.vkplay.ru'],
  parse(url: string): AnalysisResult | null {
    // Система защит от мусорных путей
    const systemPaths = ['/settings', '/messages', '/feed', '/friends', '/groups', '/apps', '/ads', '/manage', '/dev'];
    if (systemPaths.some(p => url.includes('vk.com' + p) || url.includes('vk.ru' + p) || url.includes('m.vk.com' + p))) {
      return null;
    }

    if (url.includes('clip')) return { platform: Platform.VK, possibleCategories: [Category.VIEWS, Category.LIKES, Category.COMMENTS, Category.REPOSTS], objectType: 'VK_CLIP' };
    if (url.includes('vkplay.live') || url.includes('live.vkvideo.ru')) return { platform: Platform.VK, possibleCategories: [Category.STREAMS, Category.VIEWS, Category.SUBSCRIBERS, Category.OTHER], objectType: 'VK_PLAY' };
    if (url.includes('video') || url.includes('vkvideo.ru')) return { platform: Platform.VK, possibleCategories: [Category.VIEWS, Category.LIKES, Category.COMMENTS, Category.REPOSTS], objectType: 'VK_VIDEO' };
    if (url.includes('photo')) return { platform: Platform.VK, possibleCategories: [Category.LIKES, Category.COMMENTS, Category.SAVES], objectType: 'VK_PHOTO' };
    if (url.includes('album')) return { platform: Platform.VK, possibleCategories: [Category.LIKES], objectType: 'VK_ALBUM' };
    if (url.includes('music/playlist') || url.includes('audio_playlist')) return { platform: Platform.VK, possibleCategories: [Category.PLAYS, Category.VIEWS, Category.OTHER], objectType: 'VK_PLAYLIST' };
    if (url.includes('audio')) return { platform: Platform.VK, possibleCategories: [Category.PLAYS, Category.LIKES, Category.REPOSTS, Category.OTHER], objectType: 'VK_AUDIO' };
    if (url.includes('podcast')) return { platform: Platform.VK, possibleCategories: [Category.PLAYS, Category.VIEWS, Category.OTHER], objectType: 'VK_PODCAST' };
    if (url.includes('topic-')) return { platform: Platform.VK, possibleCategories: [Category.COMMENTS, Category.VIEWS], objectType: 'VK_TOPIC' };
    if (url.includes('narrative-')) return { platform: Platform.VK, possibleCategories: [Category.VIEWS], objectType: 'VK_STORY' };
    if (url.includes('story')) return { platform: Platform.VK, possibleCategories: [Category.VIEWS, Category.LIKES, Category.REACTIONS], objectType: 'VK_STORY' };
    if (url.includes('poll-') || url.includes('#poll') || url.includes('/app7198399')) return { platform: Platform.VK, possibleCategories: [Category.POLLS], objectType: 'VK_POLL' };
    if (url.includes('call/')) return { platform: Platform.VK, possibleCategories: [Category.VIEWS, Category.OTHER], objectType: 'VK_CALL' };
    if (url.includes('/app')) return { platform: Platform.VK, possibleCategories: [Category.OTHER], objectType: 'VK_APP' };
    if (url.includes('/live')) return { platform: Platform.VK, possibleCategories: [Category.VIEWS, Category.LIKES, Category.OTHER], objectType: 'VK_PLAY' }; // Map generic VK live to VK_PLAY for now or keep separate if needed

    if (url.includes('@')) return { platform: Platform.VK, possibleCategories: [Category.VIEWS, Category.LIKES, Category.REPOSTS], objectType: 'VK_ARTICLE' };

    if (url.includes('wall')) {
      if (url.includes('reply=') || url.includes('thread=')) {
        return { platform: Platform.VK, possibleCategories: [Category.LIKES], objectType: 'VK_COMMENT' };
      }
      return { platform: Platform.VK, possibleCategories: [Category.LIKES, Category.REPOSTS, Category.VIEWS, Category.COMMENTS, Category.SAVES], objectType: 'VK_WALL' };
    }

    if (url.includes('market-') || url.includes('product-')) return { platform: Platform.VK, possibleCategories: [Category.LIKES, Category.REPOSTS, Category.COMMENTS], objectType: 'VK_MARKET' };

    if (url.includes('vk.me/')) return { platform: Platform.VK, possibleCategories: [Category.OTHER], objectType: 'VK_DM' };

    // Advanced ID parsing
    const idPath = url.split('vk.com/').pop()?.split('?')[0];
    if (idPath) {
      if (/^id\d+$/.test(idPath)) return { platform: Platform.VK, possibleCategories: [Category.FRIENDS, Category.SUBSCRIBERS, Category.OTHER], objectType: 'VK_PROFILE' };
      if (/^(club|public|event)\d+$/.test(idPath)) return { platform: Platform.VK, possibleCategories: [Category.GROUPS, Category.SUBSCRIBERS, Category.OTHER], objectType: 'VK_GROUP' };

      // If it's a shortname (no dots, no slashes, at least 2 chars)
      if (/^[a-zA-Z0-9_]{2,}$/.test(idPath)) {
        return { platform: Platform.VK, possibleCategories: [Category.GROUPS, Category.SUBSCRIBERS, Category.FRIENDS, Category.OTHER], objectType: 'VK_GROUP' };
      }
    }

    return { platform: Platform.VK, possibleCategories: [Category.GROUPS, Category.SUBSCRIBERS, Category.OTHER], objectType: 'VK_GROUP' };
  }
};
