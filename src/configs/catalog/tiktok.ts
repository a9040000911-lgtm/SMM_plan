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

export const TikTokCatalog: CatalogService[] = [
  // --- ПОДПИСЧИКИ (Target: TT_PROFILE) ---
  { 
    id: '60001', slug: 'tt-sub-economy', name: 'Подписчики (Эконом)', 
    category: Category.SUBSCRIBERS, targetType: 'TT_PROFILE', fixedPricePer1000: 10.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 23932, priority: 1 }] 
  },
  { 
    id: '60002', slug: 'tt-sub-hq', name: 'Подписчики (HQ, 30д гарантия)', 
    category: Category.SUBSCRIBERS, targetType: 'TT_PROFILE', fixedPricePer1000: 30.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 23930, priority: 1 }] 
  },
  { 
    id: '60003', slug: 'tt-sub-ru', name: 'Подписчики (РФ / СНГ)', 
    category: Category.SUBSCRIBERS, targetType: 'TT_PROFILE', fixedPricePer1000: 3500.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 1896, priority: 1 }] 
  },

  // --- ПРОСМОТРЫ (Target: TT_VIDEO) ---
  { 
    id: '60101', slug: 'tt-views-fast', name: 'Просмотры Вирусные (Fast)', 
    category: Category.VIEWS, targetType: 'TT_VIDEO', fixedPricePer1000: 1.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 230, priority: 1 }] 
  },
  { 
    id: '60102', slug: 'tt-views-guarantee', name: 'Просмотры (30д гарантия)', 
    category: Category.VIEWS, targetType: 'TT_VIDEO', fixedPricePer1000: 20.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2915, priority: 1 }] 
  },

  // --- ЛАЙКИ (Target: TT_VIDEO) ---
  { 
    id: '60201', slug: 'tt-likes-fast', name: 'Лайки (Быстрые)', 
    category: Category.LIKES, targetType: 'TT_VIDEO', fixedPricePer1000: 20.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2904, priority: 1 }] 
  },
  { 
    id: '60202', slug: 'tt-likes-ru', name: 'Лайки (РФ / СНГ)', 
    category: Category.LIKES, targetType: 'TT_VIDEO', fixedPricePer1000: 150.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2905, priority: 1 }] 
  },

  // --- РЕПОСТЫ И СОХРАНЕНИЯ (Target: TT_VIDEO) ---
  { 
    id: '60301', slug: 'tt-share', name: 'Репосты (Поделиться)', 
    category: Category.REPOSTS, targetType: 'TT_VIDEO', fixedPricePer1000: 10.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 139, priority: 1 }] 
  },
  { 
    id: '60302', slug: 'tt-save', name: 'Сохранения (Favorites)', 
    category: Category.OTHER, targetType: 'TT_VIDEO', fixedPricePer1000: 10.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 1479, priority: 1 }] 
  }
];


