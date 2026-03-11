/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { AnalysisResult, PlatformParser } from '../types';

export const TelegramParser: PlatformParser = {
  name: Platform.TELEGRAM,
  domains: ['t.me', 'telegram.me', 'telegram.dog'],
  parse(url: string): AnalysisResult | null {
    const isPrivate = url.includes('t.me/+') || url.includes('/joinchat/') || url.includes('t.me/c/') || url.includes('?invite=');

    if (url.includes('t.me/+') || url.includes('/joinchat/') || url.includes('?invite=')) {
      return { platform: Platform.TELEGRAM, possibleCategories: [Category.SUBSCRIBERS, Category.GROUPS], objectType: 'TG_INVITE', isPrivate: true };
    }

    if (url.includes('start=') || url.endsWith('bot') || url.includes('/?start') || url.includes('bot?') || url.includes('/bot/')) {
      return { platform: Platform.TELEGRAM, possibleCategories: [Category.BOTS, Category.REFERRALS, Category.OTHER], objectType: 'TG_BOT' };
    }

    if (url.includes('stars') || url.includes('/stars')) {
      return { platform: Platform.TELEGRAM, possibleCategories: [Category.STARS], objectType: 'TG_STARS' };
    }

    // Stories check should come before generic channel/post because they contain /s/ or /stories/
    if (url.includes('/s/') || url.includes('/stories/')) {
      return {
        platform: Platform.TELEGRAM,
        possibleCategories: [Category.STORIES],
        objectType: 'TG_STORY',
        isPrivate
      };
    }

    if (url.includes('/boost/') || url.includes('?boost') || url.includes('&boost') || url.includes('?c=')) return { platform: Platform.TELEGRAM, possibleCategories: [Category.BOOSTS], objectType: 'TG_BOOST' };
    if (url.includes('/proxy')) return { platform: Platform.TELEGRAM, possibleCategories: [Category.OTHER], objectType: 'TG_PROXY' };
    if (url.includes('/addlist/')) return { platform: Platform.TELEGRAM, possibleCategories: [Category.OTHER], objectType: 'TG_FOLDER' };
    if (url.includes('/$')) return { platform: Platform.TELEGRAM, possibleCategories: [Category.OTHER], objectType: 'TG_INVOICE' };

    const urlParts = url.split('?')[0].split('/');
    const lastPart = urlParts[urlParts.length - 1];

    if (/^\d+$/.test(lastPart)) {
      return {
        platform: Platform.TELEGRAM,
        possibleCategories: [Category.VIEWS, Category.REACTIONS, Category.REPOSTS, Category.COMMENTS, Category.STARS],
        objectType: 'TG_POST',
        isPrivate,
        isAlbum: url.includes('?single'),
        isComment: url.includes('?comment=')
      };
    }

    // Если нет слеша в имени (например t.me/username), это может быть профиль или канал.
    // Для SMM систем обычно t.me/username - это канал/группа. 
    // Но если мы хотим поддержать "Звезды" (подарки профилю), вынесем это в отдельный тип или добавим категорию.

    return {
      platform: Platform.TELEGRAM,
      possibleCategories: [Category.SUBSCRIBERS, Category.GROUPS, Category.BOOSTS, Category.VIEWS, Category.REACTIONS, Category.STARS],
      objectType: 'TG_CHANNEL', // Универсальный тип для t.me/name
      isPrivate
    };
  }
};
