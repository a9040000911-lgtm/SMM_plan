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

export const DiscordCatalog: CatalogService[] = [
  // --- УЧАСТНИКИ (Target: DS_SERVER) ---
  { 
    id: '80001', slug: 'ds-members-offline', name: 'Участники сервера (Offline)', 
    description: 'Дешевые участники для массовки на сервере.',
    category: Category.SUBSCRIBERS, targetType: 'DS_SERVER', fixedPricePer1000: 2500.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 1811, priority: 1 }] 
  },
  { 
    id: '80002', slug: 'ds-members-online', name: 'Участники сервера (Online)', 
    description: 'Участники со статусом Online. Повышают доверие к серверу.',
    category: Category.SUBSCRIBERS, targetType: 'DS_SERVER', fixedPricePer1000: 3000.00, 
    providers: [{ providerName: 'vexboost', providerServiceId: 1810, priority: 1 }] 
  },

  // --- БУСТЫ (Target: DS_SERVER) ---
  { 
    id: '80101', slug: 'ds-boost-pack-2', name: 'Пакет: 2 Буста (1 месяц)', 
    description: 'Позволяет разблокировать уровни преимуществ сервера.',
    category: Category.BOOSTS, targetType: 'DS_SERVER', fixedPricePer1000: 900000.00, // 900р за пакет
    providers: [{ providerName: 'vexboost', providerServiceId: 2695, priority: 1 }] 
  }
];


