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

export const TelegramCatalog: CatalogService[] = [
  // --- ПРОСМОТРЫ (Target: TG_POST) ---
  // Закупка ~0.006. Мы хотим 0.01 за 1 шт. В базу пишем 10.00 (т.е. 0.01 * 1000)
  { id: '1001', slug: 'tg-views-economy', name: 'Просмотры Эконом (Мир)', category: Category.VIEWS, targetType: 'TG_POST', fixedPricePer1000: 10.00, providers: [{ providerName: 'vexboost', providerServiceId: 2705, priority: 1 }] },
  { id: '1002', slug: 'tg-views-fast', name: 'Просмотры Быстрые', fixedPricePer1000: 30.00, category: Category.VIEWS, targetType: 'TG_POST', providers: [{ providerName: 'vexboost', providerServiceId: 2498, priority: 1 }] },
  { id: '1003', slug: 'tg-views-ru', name: 'Просмотры РФ / СНГ', fixedPricePer1000: 60.00, category: Category.VIEWS, targetType: 'TG_POST', providers: [{ providerName: 'vexboost', providerServiceId: 2759, priority: 1 }] },
  
  // --- ПАКЕТЫ И АВТОПРОСМОТРЫ (Target: TG_CHANNEL) ---
  // Если мы хотим Пакет за 70.00 руб, пишем 70000.00 (т.е. 70 * 1000)
  { id: '1105', slug: 'tg-views-set-5', name: 'Пакет: 5 последних постов', category: Category.VIEWS, targetType: 'TG_CHANNEL', metadata: { posts: 5, type: 'set' }, fixedPricePer1000: 70000.00, providers: [{ providerName: 'vexboost', providerServiceId: 1644, priority: 1 }] },
  { id: '1110', slug: 'tg-views-set-10', name: 'Пакет: 10 последних постов', category: Category.VIEWS, targetType: 'TG_CHANNEL', metadata: { posts: 10, type: 'set' }, fixedPricePer1000: 140000.00, providers: [{ providerName: 'vexboost', providerServiceId: 1645, priority: 1 }] },
  { id: '1150', slug: 'tg-views-set-50', name: 'Пакет: 50 последних постов', category: Category.VIEWS, targetType: 'TG_CHANNEL', metadata: { posts: 50, type: 'set' }, fixedPricePer1000: 700000.00, providers: [{ providerName: 'vexboost', providerServiceId: 1647, priority: 1 }] },
  { id: '1200', slug: 'tg-views-auto', name: 'АВТО-просмотры (Будущие посты)', category: Category.VIEWS, targetType: 'TG_CHANNEL', fixedPricePer1000: 10.00, providers: [{ providerName: 'vexboost', providerServiceId: 1828, priority: 1 }] },

  // --- ПОДПИСЧИКИ И БУСТЫ (Target: TG_CHANNEL) ---
  // Буст за 11000 руб/день -> 11000000.00
  { id: '2030', slug: 'tg-boost-30d', name: 'Буст канала (30 дней)', category: Category.BOOSTS, targetType: 'TG_CHANNEL', metadata: { days: 30 }, fixedPricePer1000: 196408000.00, providers: [{ providerName: 'vexboost', providerServiceId: 2574, priority: 1 }] },
  { id: '4001', slug: 'tg-sub-ru-standard', name: 'Подписчики РФ/СНГ (Стандарт)', fixedPricePer1000: 500.00, category: Category.SUBSCRIBERS, targetType: 'TG_CHANNEL', providers: [{ providerName: 'vexboost', providerServiceId: 1518, priority: 1 }] },
  { id: '4003', slug: 'tg-sub-premium-30d', name: 'Подписчики Premium (30 дней)', fixedPricePer1000: 6200.00, category: Category.SUBSCRIBERS, targetType: 'TG_CHANNEL', providers: [{ providerName: 'vexboost', providerServiceId: 2931, priority: 1 }] },

  // --- РЕАКЦИИ И КОММЕНТЫ (Target: TG_POST) ---
  { id: '3001', slug: 'tg-reaction-like', name: 'Реакция 👍', markup: 1000, category: Category.REACTIONS, targetType: 'TG_POST', metadata: { emoji: '👍' }, fixedPricePer1000: 30.00, providers: [{ providerName: 'vexboost', providerServiceId: 2009, priority: 1 }] },
  { id: '3002', slug: 'tg-reaction-heart', name: 'Реакция ❤️', markup: 1000, category: Category.REACTIONS, targetType: 'TG_POST', metadata: { emoji: '❤️' }, fixedPricePer1000: 30.00, providers: [{ providerName: 'vexboost', providerServiceId: 2006, priority: 1 }] },
  { id: '6001', slug: 'tg-comm-random', name: 'Комментарии: Случайный позитив', fixedPricePer1000: 1060.00, category: Category.COMMENTS, targetType: 'TG_POST', providers: [{ providerName: 'vexboost', providerServiceId: 2186, priority: 1 }] },
  
  // --- ЗВЕЗДЫ ---
  { id: '9001', slug: 'tg-stars-profile', name: 'Звезды на профиль / канал ⭐️', category: Category.OTHER, targetType: 'TG_CHANNEL', fixedPricePer1000: 10100.00, providers: [{ providerName: 'vexboost', providerServiceId: 2107, priority: 1 }] },
  { id: '9002', slug: 'tg-stars-post', name: 'Звезды на пост ⭐️', category: Category.OTHER, targetType: 'TG_POST', fixedPricePer1000: 10700.00, providers: [{ providerName: 'vexboost', providerServiceId: 2281, priority: 1 }] }
];


