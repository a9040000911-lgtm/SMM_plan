/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Platform, Category } from '@/generated/client';
import { analyzeLink } from '@/utils/analyzer';

export type TargetType =
  | 'POST' | 'CHANNEL' | 'PROFILE' | 'VIDEO' | 'PHOTO'
  | 'ALBUM' | 'PLAYLIST' | 'CHANNEL_POSTS' | 'STORY'
  | 'POLL' | 'MARKET' | 'EXTERNAL' | 'CUSTOM' | 'INVITE'
  | 'VK_VIDEO' | 'VK_CLIP';

export interface AnalysisResult {
  platform: Platform;
  possibleCategories: Category[];
  targetType: TargetType;
  objectType: string;
  isPrivate?: boolean;
}

export class LinkService {
  static analyze(link: string): AnalysisResult | null {
    const analysis = analyzeLink(link);
    if (!analysis) return null;

    let targetType: TargetType = 'CHANNEL'; // Fallback

    // Mapping Layer: Generic -> Legacy
    switch (analysis.objectType) {
      // TELEGRAM
      case 'TG_CHANNEL': targetType = 'CHANNEL'; break;
      case 'TG_GROUP': targetType = 'CHANNEL'; break;
      case 'TG_POST': targetType = 'POST'; break;
      case 'TG_STORY': targetType = 'STORY'; break;
      case 'TG_BOT': targetType = 'EXTERNAL'; break; // or CUSTOM
      case 'TG_BOOST': targetType = 'CHANNEL'; break; // Usually boosting a channel
      case 'TG_PROXY': targetType = 'EXTERNAL'; break;
      case 'TG_FOLDER': targetType = 'CUSTOM'; break;
      case 'TG_INVOICE': targetType = 'CUSTOM'; break;
      case 'TG_INVITE': targetType = 'CHANNEL'; break; // Treat invite as channel source for validation compatibility

      // VK
      case 'VK_PROFILE': targetType = 'CHANNEL'; break;
      case 'VK_GROUP': targetType = 'CHANNEL'; break;
      case 'VK_WALL': targetType = 'POST'; break;
      case 'VK_VIDEO': targetType = 'VK_VIDEO'; break;
      case 'VK_CLIP': targetType = 'VK_CLIP'; break;
      case 'VK_PHOTO': targetType = 'PHOTO'; break;
      case 'VK_ALBUM': targetType = 'ALBUM'; break;
      case 'VK_PLAYLIST': targetType = 'PLAYLIST'; break;
      case 'VK_STORY': targetType = 'STORY'; break;
      case 'VK_NARRATIVE': targetType = 'STORY'; break; // Close match
      case 'VK_ARTICLE': targetType = 'POST'; break;
      case 'VK_TOPIC': targetType = 'POST'; break; // Treat topic as a post-like entity
      case 'VK_POLL': targetType = 'POLL'; break;
      case 'VK_COMMENT': targetType = 'CUSTOM'; break; // Comments are specific
      case 'VK_MARKET': targetType = 'MARKET'; break;

      // INSTAGRAM
      case 'IG_PROFILE': targetType = 'PROFILE'; break;
      case 'IG_POST': targetType = 'POST'; break;
      case 'IG_REEL': targetType = 'VIDEO'; break;
      case 'IG_STORY': targetType = 'STORY'; break;
      case 'IG_HIGHLIGHT': targetType = 'STORY'; break;
      case 'IG_GUIDE': targetType = 'POST'; break;
      case 'IG_AUDIO': targetType = 'POST'; break;
      case 'IG_EFFECT': targetType = 'POST'; break;

      // YOUTUBE
      case 'YT_CHANNEL': targetType = 'CHANNEL'; break;
      case 'YT_VIDEO':
      case 'YT_SHORT':
      case 'YT_LIVE':
        targetType = 'VIDEO';
        break;
      case 'YT_PLAYLIST': targetType = 'PLAYLIST'; break;
      case 'YT_COMMUNITY': targetType = 'POST'; break;
      case 'YT_COMMENT': targetType = 'CUSTOM'; break;

      // TIKTOK
      case 'TT_PROFILE': targetType = 'PROFILE'; break;
      case 'TT_VIDEO': targetType = 'VIDEO'; break;

      // OTHER VIDEO PLATFORMS (Likee, Kwai, Kick, Trovo, Rutube, Dzen Video)
      case 'LKE_VIDEO':
      case 'KC_VIDEO':
      case 'KW_VIDEO':
      case 'RT_VIDEO':
      case 'DZ_VIDEO':
      case 'TW_VIDEO':
      case 'TW_CLIP':
        targetType = 'VIDEO';
        break;

      // OTHER PROFILES/CHANNELS
      case 'LKE_PROFILE':
      case 'KC_CHANNEL':
      case 'KW_PROFILE':
      case 'TR_CHANNEL':
      case 'RT_CHANNEL':
      case 'DZ_CHANNEL':
      case 'TW_CHANNEL':
      case 'X_PROFILE':
      case 'FB_PROFILE':
      case 'TH_PROFILE':
      case 'RD_USER':
      case 'RD_SUBREDDIT':
      case 'OK_PROFILE':
      case 'OK_GROUP': targetType = 'CHANNEL'; break;
      case 'OK_POST': targetType = 'POST'; break; // Topics are posts
      case 'OK_PHOTO': targetType = 'PHOTO'; break;
      case 'OK_VIDEO': targetType = 'VIDEO'; break;
      case 'OK_MOMENT': targetType = 'STORY'; break;
      case 'OK_AUDIO':
      case 'OK_PLAYLIST': targetType = 'POST'; break; // Treat audio as post for now
      case 'WA_GROUP':
      case 'SP_ARTIST':
      case 'SP_PLAYLIST':
      case 'SC_USER':
      case 'LI_PROFILE':
      case 'LI_COMPANY':
      case 'PI_USER':
      case 'SN_PROFILE':
        targetType = 'CHANNEL'; // Most legacy systems treat user/channel as CHANNEL or PROFILE
        if (['IG_PROFILE', 'TT_PROFILE'].includes(analysis.objectType)) targetType = 'PROFILE'; // Keep explicit profiles
        break;

      // POSTS
      case 'X_POST':
      case 'FB_POST':
      case 'TH_POST':
      case 'RD_POST':
      case 'LI_POST':
      case 'PI_PIN':
      case 'DZ_ARTICLE':
        targetType = 'POST';
        break;

      // MUSIC/AUDIO
      case 'SP_TRACK':
      case 'SC_TRACK':
        targetType = 'POST'; // Or AUDIO/VIDEO if supported, using POST for now as content item
        break;

      // STORIES
      case 'SN_STORY':
        targetType = 'STORY';
        break;

      default:
        targetType = 'CHANNEL';
    }

    return {
      platform: analysis.platform,
      targetType: targetType,
      objectType: analysis.objectType,
      possibleCategories: analysis.possibleCategories,
      isPrivate: analysis.isPrivate
    };
  }

  static getCompatibleTypes(targetType: TargetType, platform?: Platform, _category?: Category): string[] {
    const types = [targetType, 'ALL', 'CUSTOM'];

    // Broad categories mapping
    if (['POST', 'VIDEO', 'PHOTO', 'ALBUM', 'PLAYLIST', 'VK_VIDEO', 'VK_CLIP'].includes(targetType)) {
      // Content items can often use generic POST services
      if (!types.includes('POST')) types.push('POST');
      if (!types.includes('VIDEO')) types.push('VIDEO');
    }

    if (targetType === 'CHANNEL' || targetType === 'PROFILE') {
      if (!types.includes('CHANNEL')) types.push('CHANNEL');
      if (!types.includes('PROFILE')) types.push('PROFILE');
      types.push('CHANNEL_POSTS'); // Allow auto-services for any channel/profile

      // Special case for Telegram Boosts: synced services often have POST type
      // but are intended for channels.
      if (platform === 'TELEGRAM') {
        if (!types.includes('POST')) types.push('POST');
      }
    }

    return types;
  }

  static validate(link: string, platform: Platform, expectedTarget: string, allowedTargets?: string[]): { isValid: boolean; error?: string; isWarning?: boolean; warning?: string } {
    const analysis = this.analyze(link);
    if (!analysis) return { isValid: false, error: 'Неверный формат ссылки' };

    if (analysis.platform !== platform) {
      if (analysis.platform === 'OTHER') {
        return {
          isValid: true,
          isWarning: true,
          warning: `Система не смогла гарантированно распознать ссылку для платформы ${platform}. ⚠️ Формат ссылки может не подходить для этой услуги. Запуск возможен на ваш страх и риск, средства при ошибке провайдера не возвращаются.`
        };
      }
      return { isValid: false, error: `Эта ссылка от ${analysis.platform}, а вы выбрали услугу для ${platform}` };
    }

    // Если ссылка приватная, всегда выдаем Warning
    if (analysis.isPrivate) {
      return {
        isValid: true,
        isWarning: true,
        warning: `⚠️ Вы указали ссылку на закрытый чат/канал. Убедитесь, что провайдер (например, Карандаш) поддерживает работу с закрытыми ресурсами, иначе заказ будет отклонен провайдером без возврата средств.`
      };
    }

    // Специальная логика для CHANNEL_POSTS (принимаем ссылку на канал)
    if (expectedTarget === 'CHANNEL_POSTS' && analysis.targetType === 'CHANNEL') {
      return { isValid: true };
    }

    // Check if the detected targetType matches either the primary expectedTarget OR any of the allowedTargets
    const isTargetMatch = analysis.targetType === expectedTarget || (allowedTargets && allowedTargets.includes(analysis.targetType));

    if (!isTargetMatch) {
      // Специальная логика для универсального типа VIDEO во ВК
      if (platform === 'VK' && expectedTarget === 'VIDEO') {
        if (analysis.targetType === 'VK_VIDEO' || analysis.targetType === 'VK_CLIP') {
          return { isValid: true };
        }
      }

      // Специальная логика для Telegram Boosts: бусты могут требовать тип POST, но применяются к каналам (TG_BOOST)
      if (platform === 'TELEGRAM' && expectedTarget === 'POST') {
        if (analysis.objectType === 'TG_BOOST') {
          return { isValid: true };
        }
      }

      const labels: Record<string, string> = {
        'POST': 'на пост/публикацию',
        'CHANNEL': 'на канал/сообщество',
        'PROFILE': 'на профиль',
        'VIDEO': 'на видео/клип',
        'VK_VIDEO': 'на видео',
        'VK_CLIP': 'на клип',
        'STORY': 'на сторис',
        'COMMENT': 'на комментарий'
      };

      let expectedLabel = labels[expectedTarget] || expectedTarget;
      if (allowedTargets && allowedTargets.length > 0) {
        const allowedLabels = allowedTargets.map(t => labels[t] || t).join(' или ');
        expectedLabel += ` или ${allowedLabels}`;
      }

      return {
        isValid: true,
        isWarning: true,
        warning: `⚠️ Внимание! Вы выбрали услугу ${expectedLabel}, но прислали ссылку ${labels[analysis.targetType] || labels[analysis.targetType] || analysis.targetType}. Провайдер может не найти нужный объект, и услуга не выполнится. Средства при ошибке ввода не возвращаются. Вы уверены, что хотите запустить заказ с этой ссылкой?`
      };
    }

    return { isValid: true };
  }
}
