/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';

export interface TierDefinition {
  code: string;
  name: string;
  description: string;
  platform: Platform;
  category: Category;
  targetType: 'POST' | 'PROFILE' | 'ALL';

  filters: {
    minPrice: number;
    maxPrice: number;
    mustContain?: string[];
    mustNotContain?: string[];
    mustContainAll?: string[];
  };

  sellingMargin: number;
  minSellingPrice?: number;
}

export const TIERS: TierDefinition[] = [
  // ===========================================================================
  // TELEGRAM SUBSCRIBERS (ПОДПИСЧИКИ)
  // ===========================================================================
  {
    code: 'TG_SUBS_START',
    name: '📉 TG Подписчики (Старт)',
    description: 'Бюджетный вариант для старта. База: Весь мир (Микс). Средняя скорость.',
    platform: 'TELEGRAM',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 15,
      maxPrice: 100,
      mustNotContain: [
        'india', 'arab', 'china', 'iran', 'vietnam', 'brazil', 'turkey',
        'refill', 'guarantee', '30d', 'r30', 'no drop', 'non drop', 'ru', 'russia', 'rus',
        'high drop', 'unstable', 'low quality', 'bot', 'dead'
      ]
    },
    sellingMargin: 5.0
  },
  {
    code: 'TG_SUBS_RU_ECO',
    name: '🇷🇺 TG Подписчики (РФ Эконом)',
    description: 'Бюджетные подписчики из РФ/СНГ. Русские имена. Для визуальной массы.',
    platform: 'TELEGRAM',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 30,
      maxPrice: 150,
      mustContain: ['ru', 'russia', 'рф', 'рус', 'cis', 'снг'],
      mustNotContain: ['real', 'живые', 'active', 'high drop']
    },
    sellingMargin: 4.0
  },
  {
    code: 'TG_SUBS_RU_REAL',
    name: '🇷🇺 TG Подписчики (РФ Живые)',
    description: 'Высокое качество. Реальные пользователи РФ/СНГ. Минимальные списания.',
    platform: 'TELEGRAM',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 150,
      maxPrice: 5000,
      mustContain: ['ru', 'russia', 'рф', 'рус', 'cis', 'снг'],
    },
    sellingMargin: 3.0
  },
  {
    code: 'TG_SUBS_FAST',
    name: '⚡️ TG Подписчики (Быстрые)',
    description: 'Высокая скорость запуска и выполнения. Для срочных задач.',
    platform: 'TELEGRAM',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 50,
      maxPrice: 300,
      mustContain: ['fast', 'instant', 'speed', 'быстр', 'момент'],
      mustNotContain: ['slow', 'медлен', 'high drop']
    },
    sellingMargin: 4.0
  },
  {
    code: 'TG_SUBS_PREM',
    name: '💎 TG Подписчики (Премиум Гарантия)',
    description: 'Элитное качество. Гарантия от списаний (No Drop / Refill). Живые профили.',
    platform: 'TELEGRAM',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 150,
      maxPrice: 1500,
      mustContain: ['no drop', 'non drop', 'refill', 'guarantee'],
      mustNotContain: ['ru', 'russia']
    },
    sellingMargin: 3.0
  },

  // ===========================================================================
  // TELEGRAM VIEWS (ПРОСМОТРЫ)
  // ===========================================================================
  {
    code: 'TG_VIEWS_FAST',
    name: '👁 TG Просмотры (Быстрые)',
    description: 'Моментальные просмотры на пост. Весь мир.',
    platform: 'TELEGRAM',
    category: 'VIEWS',
    targetType: 'POST',
    filters: {
      minPrice: 0.05,
      maxPrice: 10,
      mustContain: ['view', 'просмотр'],
      mustNotContain: ['ru', 'russia', 'auto', 'sub', 'подпис', 'like', 'лайк', 'india', 'slow', 'future', 'будущ']
    },
    sellingMargin: 10.0,
    minSellingPrice: 5.0
  },
  {
    code: 'TG_VIEWS_RU',
    name: '🇷🇺 TG Просмотры (РФ)',
    description: 'Просмотры от пользователей из РФ. Подходит для статистики.',
    platform: 'TELEGRAM',
    category: 'VIEWS',
    targetType: 'POST',
    filters: {
      minPrice: 0.5,
      maxPrice: 100,
      mustContain: ['ru', 'russia', 'рф'],
      mustNotContain: ['auto', 'future', 'будущ']
    },
    sellingMargin: 5.0
  },
  {
    code: 'TG_VIEWS_MULTI',
    name: '👁 TG Просмотры (Текущий + 2 предыд.)',
    description: 'Просмотры на последний пост и 2 предыдущих (всего 3 поста). Принимает ссылку на КАНАЛ.',
    platform: 'TELEGRAM',
    category: 'VIEWS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 5,
      maxPrice: 1000,
      mustContain: ['+2', 'предыдущ', 'previous'],
    },
    sellingMargin: 4.0
  },
  {
    code: 'TG_VIEWS_LAST_5',
    name: '👁 TG Просмотры (Посл. 5 постов)',
    description: 'Просмотры на 5 последних публикаций. Принимает ссылку на КАНАЛ.',
    platform: 'TELEGRAM',
    category: 'VIEWS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 1,
      maxPrice: 300,
      mustContain: ['last 5', 'последние 5'],
    },
    sellingMargin: 5.0
  },
  {
    code: 'TG_VIEWS_LAST_10',
    name: '👁 TG Просмотры (Посл. 10 постов)',
    description: 'Просмотры на 10 последних публикаций. Принимает ссылку на КАНАЛ.',
    platform: 'TELEGRAM',
    category: 'VIEWS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 2,
      maxPrice: 500,
      mustContain: ['last 10', 'последние 10'],
    },
    sellingMargin: 5.0
  },
  {
    code: 'TG_VIEWS_LAST_20',
    name: '👁 TG Просмотры (Посл. 20 постов)',
    description: 'Просмотры на 20 последних публикаций. Принимает ссылку на КАНАЛ.',
    platform: 'TELEGRAM',
    category: 'VIEWS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 5,
      maxPrice: 1000,
      mustContain: ['last 20', 'последние 20'],
    },
    sellingMargin: 5.0
  },
  {
    code: 'TG_VIEWS_AUTO',
    name: '👁 TG Авто-просмотры (Новые посты)',
    description: 'Автоматические просмотры на будущие посты. Принимает ссылку на КАНАЛ.',
    platform: 'TELEGRAM',
    category: 'VIEWS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 5,
      maxPrice: 500,
      mustContain: ['auto', 'future', 'будущ', 'авто'],
    },
    sellingMargin: 5.0
  },

  // ===========================================================================
  // TELEGRAM REACTIONS (РЕАКЦИИ)
  // ===========================================================================
  {
    code: 'TG_REACT_POS',
    name: '👍 TG Реакции (Позитив)',
    description: 'Микс положительных реакций (👍, 🔥, 🎉). Моментальный старт.',
    platform: 'TELEGRAM',
    category: 'REACTIONS',
    targetType: 'POST',
    filters: {
      minPrice: 0.1,
      maxPrice: 100,
      mustContain: ['positive', 'pos', 'позитив', '👍'],
      mustNotContain: ['neg', 'negative', 'auto', 'авто']
    },
    sellingMargin: 6.0
  },
  {
    code: 'TG_REACT_NEG',
    name: '👎 TG Реакции (Негатив)',
    description: 'Микс отрицательных реакций (👎, 💩, 🤡).',
    platform: 'TELEGRAM',
    category: 'REACTIONS',
    targetType: 'POST',
    filters: {
      minPrice: 0.1,
      maxPrice: 100,
      mustContain: ['negative', 'neg', 'негатив', '👎'],
      mustNotContain: ['auto', 'авто']
    },
    sellingMargin: 6.0
  },
  {
    code: 'TG_REACT_AUTO',
    name: '👍 TG Авто-реакции (Новые посты)',
    description: 'Автоматические реакции на будущие посты. Принимает ссылку на КАНАЛ.',
    platform: 'TELEGRAM',
    category: 'REACTIONS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 10,
      maxPrice: 1000,
      mustContain: ['auto', 'авто'],
    },
    sellingMargin: 4.0
  },

  // ===========================================================================
  // TELEGRAM COMMENTS (КОММЕНТАРИИ)
  // ===========================================================================
  {
    code: 'TG_COMM_RANDOM',
    name: '💬 TG Комментарии (Позитив)',
    description: 'Случайные положительные комментарии на русском языке. Моментальный старт.',
    platform: 'TELEGRAM',
    category: 'COMMENTS',
    targetType: 'POST',
    filters: {
      minPrice: 1,
      maxPrice: 100,
      mustContain: ['русские', 'рандомные'],
      mustNotContain: ['настраиваемые', 'custom', 'auto', 'авто']
    },
    sellingMargin: 10.0
  },
  {
    code: 'TG_COMM_CUSTOM',
    name: '✍️ TG Комментарии (Свои)',
    description: 'Вы сами указываете текст комментариев. Каждый текст с новой строки.',
    platform: 'TELEGRAM',
    category: 'COMMENTS',
    targetType: 'POST',
    filters: {
      minPrice: 10,
      maxPrice: 200,
      mustContain: ['настраиваемые', 'custom'],
    },
    sellingMargin: 5.0
  },
  {
    code: 'TG_COMM_AUTO',
    name: '💬 TG Авто-комментарии (Новые посты)',
    description: 'Автоматические положительные комментарии на будущие посты. Принимает ссылку на КАНАЛ.',
    platform: 'TELEGRAM',
    category: 'COMMENTS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 1,
      maxPrice: 100,
      mustContain: ['подписка', 'авто', 'future'],
    },
    sellingMargin: 8.0
  },

  // ===========================================================================
  // INSTAGRAM
  // ===========================================================================
  {
    code: 'IG_SUBS_MIX',
    name: '📉 IG Подписчики (Микс)',
    description: 'Базовое качество, микс аккаунтов. Для количества.',
    platform: 'INSTAGRAM',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 1,
      maxPrice: 50,
      mustContain: ['follow', 'sub', 'подпис'],
      mustNotContain: ['refill', 'guarantee', 'view', 'like', 'india', 'arab']
    },
    sellingMargin: 5.0
  },
  {
    code: 'IG_LIKES_FAST',
    name: '❤️ IG Лайки (Быстрые)',
    description: 'Моментальные лайки на фото/рилс.',
    platform: 'INSTAGRAM',
    category: 'LIKES',
    targetType: 'POST',
    filters: {
      minPrice: 0.1,
      maxPrice: 20,
      mustContain: ['like', 'лайк'],
      mustNotContain: ['view', 'sub', 'подпис']
    },
    sellingMargin: 5.0
  },

  // ===========================================================================
  // TIKTOK
  // ===========================================================================
  {
    code: 'TT_SUBS',
    name: '📉 TikTok Подписчики',
    description: 'Качественные подписчики на профиль TikTok. Весь мир.',
    platform: 'TIKTOK',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 50,
      maxPrice: 500,
      mustContain: ['follower', 'sub', 'подпис'],
      mustNotContain: ['view', 'like', 'india', 'arab', 'low quality']
    },
    sellingMargin: 4.0
  },
  {
    code: 'TT_LIKES',
    name: '❤️ TikTok Лайки',
    description: 'Лайки на видео TikTok. Быстрый старт.',
    platform: 'TIKTOK',
    category: 'LIKES',
    targetType: 'POST',
    filters: {
      minPrice: 10,
      maxPrice: 100,
      mustContain: ['like', 'лайк'],
      mustNotContain: ['view', 'sub', 'follower']
    },
    sellingMargin: 5.0
  },
  {
    code: 'TT_VIEWS',
    name: '👁 TikTok Просмотры',
    description: 'Просмотры видео TikTok. Моментально.',
    platform: 'TIKTOK',
    category: 'VIEWS',
    targetType: 'POST',
    filters: {
      minPrice: 0.1,
      maxPrice: 10,
      mustContain: ['view', 'просмотр'],
    },
    sellingMargin: 10.0,
    minSellingPrice: 5.0
  },

  // ===========================================================================
  // YOUTUBE
  // ===========================================================================
  {
    code: 'YT_SUBS',
    name: '📉 YouTube Подписчики (HQ)',
    description: 'Подписчики на канал. Высокое качество, с гарантией от списаний.',
    platform: 'YOUTUBE',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 500,
      maxPrice: 5000,
      mustContain: ['sub', 'подпис', 'hq', 'guarantee', 'refill'],
      mustNotContain: ['view', 'like', 'india', 'arab', 'bot']
    },
    sellingMargin: 3.0
  },
  {
    code: 'YT_LIKES',
    name: '❤️ YouTube Лайки',
    description: 'Лайки на видео YouTube. Без списаний.',
    platform: 'YOUTUBE',
    category: 'LIKES',
    targetType: 'POST',
    filters: {
      minPrice: 50,
      maxPrice: 500,
      mustContain: ['like', 'лайк'],
      mustNotContain: ['view', 'sub']
    },
    sellingMargin: 4.0
  },
  {
    code: 'YT_VIEWS',
    name: '👁 YouTube Просмотры',
    description: 'Удержание и просмотры видео YouTube.',
    platform: 'YOUTUBE',
    category: 'VIEWS',
    targetType: 'POST',
    filters: {
      minPrice: 100,
      maxPrice: 800,
      mustContain: ['view', 'просмотр'],
      mustNotContain: ['sub', 'like', 'adword']
    },
    sellingMargin: 3.0
  },

  // ===========================================================================
  // VK (ВКОНТАКТЕ)
  // ===========================================================================
  {
    code: 'VK_SUBS_GROUP',
    name: '👥 VK Подписчики (Группа)',
    description: 'Вступления в группу или паблик VK. Качественные офферы.',
    platform: 'VK',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 100,
      maxPrice: 600,
      mustContain: ['group', 'групп', 'паблик', 'public', 'sub', 'подпис'],
      mustNotContain: ['friend', 'друг', 'like', 'лайк', 'view']
    },
    sellingMargin: 3.0
  },
  {
    code: 'VK_FRIENDS',
    name: '👤 VK Друзья',
    description: 'Заявки в друзья или подписчики на профиль VK.',
    platform: 'VK',
    category: 'SUBSCRIBERS',
    targetType: 'PROFILE',
    filters: {
      minPrice: 100,
      maxPrice: 600,
      mustContain: ['friend', 'друг', 'profile', 'профил'],
      mustNotContain: ['group', 'групп', 'like', 'лайк']
    },
    sellingMargin: 3.0
  },
  {
    code: 'VK_LIKES',
    name: '❤️ VK Лайки',
    description: 'Лайки на посты, фото или видео VK.',
    platform: 'VK',
    category: 'LIKES',
    targetType: 'POST',
    filters: {
      minPrice: 30,
      maxPrice: 300,
      mustContain: ['like', 'лайк'],
      mustNotContain: ['sub', 'friend', 'view']
    },
    sellingMargin: 4.0
  }
];


