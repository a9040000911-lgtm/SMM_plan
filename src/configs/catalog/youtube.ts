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

export const YouTubeCatalog: CatalogService[] = [
  // --- ПОДПИСЧИКИ (Target: YT_CHANNEL) ---
  { 
    id: '50001', slug: 'yt-sub-economy', name: 'Подписчики (Эконом)', 
    category: Category.SUBSCRIBERS, targetType: 'YT_CHANNEL', fixedPricePer1000: 150.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 1711, priority: 1 }] 
  },
  { 
    id: '50002', slug: 'yt-sub-guarantee', name: 'Подписчики (30д гарантия)', 
    category: Category.SUBSCRIBERS, targetType: 'YT_CHANNEL', fixedPricePer1000: 10000.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2945, priority: 1 }] 
  },

  // --- ПРОСМОТРЫ (Target: YT_VIDEO / YT_SHORT) ---
  { 
    id: '50101', slug: 'yt-views-video', name: 'Просмотры Видео (Гарантия)', 
    category: Category.VIEWS, targetType: 'YT_VIDEO', fixedPricePer1000: 650.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 1692, priority: 1 }] 
  },
  { 
    id: '50102', slug: 'yt-views-shorts', name: 'Просмотры Shorts', 
    category: Category.VIEWS, targetType: 'YT_SHORT', fixedPricePer1000: 1000.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 2335, priority: 1 }] 
  },
  { 
    id: '50103', slug: 'yt-views-seo', name: 'Просмотры SEO (Удержание)', 
    category: Category.VIEWS, targetType: 'YT_VIDEO', fixedPricePer1000: 10.00, 
    providers: [{ providerName: 'stream-promotion', providerServiceId: 569, priority: 1 }] 
  },

  // --- ЛАЙКИ (Target: YT_VIDEO / YT_SHORT) ---
  { 
    id: '50201', slug: 'yt-likes', name: 'Лайки (Видео / Shorts)', 
    category: Category.LIKES, targetType: 'YT_VIDEO', fixedPricePer1000: 250.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 1909, priority: 1 }] 
  },

  // --- ЧАСЫ ПРОСМОТРА (Target: YT_VIDEO) ---
  { 
    id: '50301', slug: 'yt-watch-time', name: 'Часы просмотра (Для монетизации)', 
    description: 'Требуется видео длиной 15+ минут. Безопасно для канала.',
    category: Category.VIEWS, targetType: 'YT_VIDEO', fixedPricePer1000: 25000.00, // 25р за час
    providers: [{ providerName: 'vexboost', providerServiceId: 2338, priority: 1 }] 
  }
];


