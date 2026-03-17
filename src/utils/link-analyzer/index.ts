/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { PlatformParser, AnalysisResult } from './types';
import { Platform, Category } from '@/generated/client';
import { TelegramParser } from './platforms/telegram';
import { VkParser } from './platforms/vk';
import { InstagramParser } from './platforms/instagram';
import { YoutubeParser } from './platforms/youtube';
import { TiktokParser } from './platforms/tiktok';
import { MaxParser } from './platforms/max';
import { OkParser } from './platforms/ok';
import { MusicParser } from './platforms/music';
import { TwitchParser } from './platforms/twitch';
import { LikeeParser } from './platforms/likee';
import { TwitterParser } from './platforms/twitter';

const PARSERS: PlatformParser[] = [
  TelegramParser,
  VkParser,
  InstagramParser,
  YoutubeParser,
  TiktokParser,
  MaxParser,
  TwitterParser,
  OkParser,
  MusicParser,
  TwitchParser,
  LikeeParser,
];

export function analyzeLink(link: string): AnalysisResult | null {
  let url = link.trim().toLowerCase();

  if (!url.startsWith('http') && !url.includes('.')) {
    return null; 
  }

  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  try {
    const urlObj = new URL(url);
    const paramsToRemove = ['igsh', 'utm_source', 'utm_medium', 'utm_campaign', 'from', 'list', 'ref'];
    paramsToRemove.forEach(p => urlObj.searchParams.delete(p));
    urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
    url = urlObj.toString().toLowerCase();
  } catch (_e) {
    url = url.toLowerCase();
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');

    for (const parser of PARSERS) {
      if (parser.domains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
        const result = parser.parse(url);
        if (result) return result;
      }
    }
  } catch (_e) {
    // If URL parsing fails, fallback to loose includes or just return null
    for (const parser of PARSERS) {
      if (parser.domains.some(domain => url.includes(domain))) {
        const result = parser.parse(url);
        if (result) return result;
      }
    }
  }

  // Final check - if it's t.me/ something it might have failed URL but is still Telegram
  if (url.includes('t.me/')) {
     const result = TelegramParser.parse(url);
     if (result) return result;
  }

  // Fallback for all other websites not natively parsed
  try {
    new URL(url);
    return {
      platform: 'OTHER' as Platform,
      possibleCategories: ['TRAFFIC', 'OTHER', 'REVIEWS'] as Category[],
      objectType: 'WEB_SITE' as any,
    };
  } catch (e) {
    return null;
  }
}

export * from './types';

export function mapObjectTypeToTargetType(objectType: string | undefined): 'CHANNEL' | 'POST' | 'STORY' | 'CUSTOM' | 'EXTERNAL' | 'COMMENT' {
  if (!objectType) return 'CHANNEL'; // Default fallback

  const typeMap: Record<string, string> = {
    // Telegram
    'TG_CHANNEL': 'CHANNEL',
    'TG_GROUP': 'CHANNEL',
    'TG_PROFILE': 'CHANNEL', // Stars logic
    'TG_POST': 'POST',
    'TG_STORY': 'STORY',
    'TG_BOT': 'EXTERNAL',
    'TG_BOOST': 'CHANNEL',
    'TG_PROXY': 'EXTERNAL',
    'TG_FOLDER': 'CUSTOM',
    'TG_INVOICE': 'CUSTOM',
    'TG_INVITE': 'CHANNEL',
    'TG_STARS': 'CUSTOM',

    // VK
    'VK_PROFILE': 'CHANNEL',
    'VK_GROUP': 'CHANNEL',
    'VK_WALL': 'POST',
    'VK_PHOTO': 'POST',
    'VK_VIDEO': 'POST',
    'VK_CLIP': 'POST',
    'VK_PLAY': 'POST',
    'VK_PLAY_CHANNEL': 'CHANNEL',
    'VK_PLAY_LIVE': 'POST',
    'VK_POST': 'POST',
    'VK_ARTICLE': 'POST',
    'VK_STORY': 'STORY',
    'VK_MARKET': 'POST',
    'VK_PLAYLIST': 'CUSTOM',
    'VK_COMMENT': 'COMMENT',
    'VK_TOPIC': 'COMMENT',
    'VK_POLL': 'CUSTOM',
    'VK_INVITE': 'CHANNEL',
    'VK_APP': 'CUSTOM',
    'VK_PODCAST': 'POST',
    'VK_AUDIO': 'CUSTOM',
    'VK_CALL': 'CUSTOM',
    'VK_DM': 'EXTERNAL',

    // IG
    'IG_PROFILE': 'CHANNEL',
    'IG_POST': 'POST',
    'IG_REEL': 'POST',
    'IG_STORY': 'STORY',
    'IG_HIGHLIGHT': 'STORY',
    'IG_IGTV': 'POST',
    'IG_AUDIO': 'CUSTOM',

    // YT
    'YT_CHANNEL': 'CHANNEL',
    'YT_VIDEO': 'POST',
    'YT_SHORTS': 'POST',
    'YT_LIVE': 'POST',
    'YT_POST': 'POST',
    'YT_PLAYLIST': 'CUSTOM',

    // TT
    'TT_PROFILE': 'CHANNEL',
    'TT_VIDEO': 'POST',
    'TT_PHOTO': 'POST',

    // MAX
    'MAX_CHANNEL': 'CHANNEL',
    'MAX_GROUP': 'CHANNEL',
    'MAX_PROFILE': 'CHANNEL',
    'MAX_BOT': 'EXTERNAL',
  };

  return (typeMap[objectType] as any) || 'POST';
}
