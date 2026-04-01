/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Category } from '@prisma/client';

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

export const LikeeCatalog: CatalogService[] = [
  // --- ПОДПИСЧИКИ (Target: LK_PROFILE) ---
  { 
    id: '70001', slug: 'lk-sub-economy', name: 'Подписчики (Эконом)', 
    category: Category.SUBSCRIBERS, targetType: 'LK_PROFILE', fixedPricePer1000: 150.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 33434, priority: 1 }] 
  },
  { 
    id: '70002', slug: 'lk-sub-hq', name: 'Подписчики (HQ Quality)', 
    category: Category.SUBSCRIBERS, targetType: 'LK_PROFILE', fixedPricePer1000: 5000.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2486, priority: 1 }] 
  },

  // --- ЛАЙКИ И ПРОСМОТРЫ (Target: LK_VIDEO) ---
  { 
    id: '70101', slug: 'lk-likes-hq', name: 'Лайки (HQ Quality)', 
    category: Category.LIKES, targetType: 'LK_VIDEO', fixedPricePer1000: 1000.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2487, priority: 1 }] 
  },
  { 
    id: '70102', slug: 'lk-views-hq', name: 'Просмотры (HQ Quality)', 
    category: Category.VIEWS, targetType: 'LK_VIDEO', fixedPricePer1000: 1000.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2488, priority: 1 }] 
  },
  { 
    id: '70103', slug: 'lk-combo-fast', name: 'Комбо: Лайк + Просмотр', 
    category: Category.OTHER, targetType: 'LK_VIDEO', fixedPricePer1000: 100.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 33433, priority: 1 }] 
  },

  // --- РЕПОСТЫ ---
  { 
    id: '70201', slug: 'lk-share', name: 'Репосты (Поделиться)', 
    category: Category.REPOSTS, targetType: 'LK_VIDEO', fixedPricePer1000: 1000.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2489, priority: 1 }] 
  }
];


