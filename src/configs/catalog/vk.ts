/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Category } from '@/generated/client';

export interface CatalogService {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: Category;
  targetType: string;
  metadata?: any;
  fixedPricePer1000?: number;
  markup?: number;
  providers: {
    providerName: string;
    providerServiceId: number;
    priority: number;
  }[];
}

export const DEFAULT_MARKUP = 500;

export const VKCatalog: CatalogService[] = [
  // --- ПОДПИСЧИКИ (Target: VK_GROUP) ---
  {
    id: '20001',
    slug: 'vk-sub-group-hq',
    name: 'Подписчики в группу (HQ)',
    category: Category.GROUPS,
    targetType: 'VK_GROUP',
    fixedPricePer1000: 10.00, // 0.01 за шт.
    providers: [{ providerName: 'stream-promotion', providerServiceId: 792, priority: 1 }]
  },
  {
    id: '20002',
    slug: 'vk-sub-group-live',
    name: 'Подписчики в группу (Живые РФ)',
    category: Category.GROUPS,
    targetType: 'VK_GROUP',
    fixedPricePer1000: 30.00, // 0.03 за шт.
    providers: [{ providerName: 'stream-promotion', providerServiceId: 146, priority: 1 }]
  },

  // --- ДРУЗЬЯ (Target: VK_PROFILE) ---
  {
    id: '20101',
    slug: 'vk-friends-live',
    name: 'Друзья / Подписчики на профиль',
    category: Category.SUBSCRIBERS,
    targetType: 'VK_PROFILE',
    fixedPricePer1000: 50.00, // 0.05 за шт.
    providers: [{ providerName: 'stream-promotion', providerServiceId: 934, priority: 1 }]
  },

  // --- ЛАЙКИ (Target: VK_WALL / VK_PHOTO) ---
  {
    id: '20201',
    slug: 'vk-likes-post',
    name: 'Лайки на пост / фото',
    category: Category.LIKES,
    targetType: 'VK_WALL',
    fixedPricePer1000: 10.00,
    providers: [{ providerName: 'stream-promotion', providerServiceId: 23917, priority: 1 }]
  },
  {
    id: '20202',
    slug: 'vk-likes-photo',
    name: 'Лайки на фото',
    category: Category.LIKES,
    targetType: 'VK_PHOTO',
    fixedPricePer1000: 10.00,
    providers: [{ providerName: 'stream-promotion', providerServiceId: 23917, priority: 1 }]
  },

  // --- ПРОСМОТРЫ (Target: VK_WALL / VK_VIDEO / VK_CLIP) ---
  {
    id: '20301',
    slug: 'vk-views-post',
    name: 'Просмотры на пост (Глазик)',
    category: Category.VIEWS,
    targetType: 'VK_WALL',
    fixedPricePer1000: 1.00, // 0.001 за шт.
    providers: [{ providerName: 'stream-promotion', providerServiceId: 940, priority: 1 }]
  },
  {
    id: '20302',
    slug: 'vk-views-video',
    name: 'Просмотры на Видео',
    category: Category.VIEWS,
    targetType: 'VK_VIDEO',
    fixedPricePer1000: 10.00,
    providers: [{ providerName: 'stream-promotion', providerServiceId: 31329, priority: 1 }]
  },
  {
    id: '20303',
    slug: 'vk-views-clip',
    name: 'Просмотры на Клип',
    category: Category.VIEWS,
    targetType: 'VK_CLIP',
    fixedPricePer1000: 10.00,
    providers: [{ providerName: 'stream-promotion', providerServiceId: 27579, priority: 1 }]
  },

  // --- ПЛЕЙЛИСТЫ (Target: VK_PLAYLIST) ---
  {
    id: '20401',
    slug: 'vk-playlist-economy',
    name: 'Прослушивания плейлиста (Эконом)',
    category: Category.VIEWS,
    targetType: 'VK_PLAYLIST',
    fixedPricePer1000: 10.00,
    providers: [{ providerName: 'stream-promotion', providerServiceId: 27577, priority: 1 }]
  },
  {
    id: '20402',
    slug: 'vk-playlist-live',
    name: 'Прослушивания плейлиста (РФ/СНГ)',
    category: Category.VIEWS,
    targetType: 'VK_PLAYLIST',
    fixedPricePer1000: 40.00,
    providers: [{ providerName: 'stream-promotion', providerServiceId: 361, priority: 1 }]
  },

  // --- РЕПОСТЫ (Target: VK_WALL) ---
  {
    id: '20501',
    slug: 'vk-reposts-wall',
    name: 'Репосты на стену',
    category: Category.REPOSTS,
    targetType: 'VK_WALL',
    fixedPricePer1000: 15.00,
    providers: [{ providerName: 'stream-promotion', providerServiceId: 938, priority: 1 }]
  }
];
