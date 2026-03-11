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

export const InstagramCatalog: CatalogService[] = [
  // --- ПОДПИСЧИКИ (Target: IG_PROFILE) ---
  {
    id: '30001', slug: 'ig-sub-economy', name: 'Подписчики (Эконом)',
    category: Category.SUBSCRIBERS, targetType: 'IG_PROFILE', fixedPricePer1000: 500.00,
    providers: [{ providerName: 'vexboost', providerServiceId: 2562, priority: 1 }]
  },
  {
    id: '30002', slug: 'ig-sub-ru', name: 'Подписчики (РФ / СНГ)',
    category: Category.SUBSCRIBERS, targetType: 'IG_PROFILE', fixedPricePer1000: 400.00,
    providers: [{ providerName: 'vexboost', providerServiceId: 2566, priority: 1 }]
  },
  {
    id: '30003', slug: 'ig-sub-premium', name: 'Подписчики (Premium Quality)',
    category: Category.SUBSCRIBERS, targetType: 'IG_PROFILE', fixedPricePer1000: 800.00,
    providers: [{ providerName: 'vexboost', providerServiceId: 2660, priority: 1 }]
  },

  // --- ЛАЙКИ (Target: IG_POST / IG_REEL) ---
  {
    id: '30101', slug: 'ig-likes-economy', name: 'Лайки (Эконом)',
    category: Category.LIKES, targetType: 'IG_POST', fixedPricePer1000: 100.00,
    providers: [{ providerName: 'vexboost', providerServiceId: 2263, priority: 1 }]
  },
  {
    id: '30102', slug: 'ig-likes-ru', name: 'Лайки (РФ / СНГ)',
    category: Category.LIKES, targetType: 'IG_POST', fixedPricePer1000: 550.00,
    providers: [{ providerName: 'vexboost', providerServiceId: 2566, priority: 1 }]
  },

  // --- ПРОСМОТРЫ (Target: IG_POST / IG_REEL / IG_STORY) ---
  {
    id: '30201', slug: 'ig-views-video', name: 'Просмотры Видео / Reels',
    category: Category.VIEWS, targetType: 'IG_POST', fixedPricePer1000: 10.00,
    providers: [{ providerName: 'vexboost', providerServiceId: 2411, priority: 1 }]
  },
  {
    id: '30202', slug: 'ig-views-reels', name: 'Просмотры Reels (Спец)',
    category: Category.VIEWS, targetType: 'IG_REEL', fixedPricePer1000: 10.00,
    providers: [{ providerName: 'vexboost', providerServiceId: 2411, priority: 1 }]
  },
  {
    id: '30203', slug: 'ig-views-story', name: 'Просмотры Историй (Story)',
    category: Category.VIEWS, targetType: 'IG_STORY', fixedPricePer1000: 10.00,
    providers: [{ providerName: 'vexboost', providerServiceId: 2423, priority: 1 }]
  },

  // --- ДОПОЛНИТЕЛЬНО ---
  {
    id: '30301', slug: 'ig-save', name: 'Сохранения поста',
    category: Category.OTHER, targetType: 'IG_POST', fixedPricePer1000: 50.00,
    providers: [{ providerName: 'vexboost', providerServiceId: 991, priority: 1 }]
  }
];
