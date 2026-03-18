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

export const TwitchCatalog: CatalogService[] = [
  // --- ФОЛЛОВЕРЫ (Target: TW_CHANNEL) ---
  { 
    id: '40001', slug: 'tw-sub-economy', name: 'Фолловеры (Эконом)', 
    category: Category.SUBSCRIBERS, targetType: 'TW_CHANNEL', fixedPricePer1000: 10.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 61, priority: 1 }] 
  },
  { 
    id: '40002', slug: 'tw-sub-live', name: 'Фолловеры (Живые, 90д гарантия)', 
    category: Category.SUBSCRIBERS, targetType: 'TW_CHANNEL', fixedPricePer1000: 30.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 625, priority: 1 }] 
  },

  // --- ЗРИТЕЛИ (Target: TW_CHANNEL / TW_LIVE) ---
  { 
    id: '40101', slug: 'tw-live-1h', name: 'Зрители на стрим (1 час)', 
    category: Category.VIEWS, targetType: 'TW_CHANNEL', fixedPricePer1000: 20.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 701, priority: 1 }] 
  },
  { 
    id: '40102', slug: 'tw-live-24h', name: 'Зрители на стрим (24 часа)', 
    category: Category.VIEWS, targetType: 'TW_CHANNEL', fixedPricePer1000: 100.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 512, priority: 1 }] 
  },

  // --- КЛИПЫ И ВИДЕО (Target: TW_CLIP / TW_VIDEO) ---
  { 
    id: '40201', slug: 'tw-views-clip', name: 'Просмотры клипа', 
    category: Category.VIEWS, targetType: 'TW_CLIP', fixedPricePer1000: 10.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 673, priority: 1 }] 
  },
  { 
    id: '40202', slug: 'tw-views-vod', name: 'Просмотры видео (VOD)', 
    category: Category.VIEWS, targetType: 'TW_VIDEO', fixedPricePer1000: 80.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2092, priority: 1 }] 
  }
];


