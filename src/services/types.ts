/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */


export const Platform = {
  TELEGRAM: 'TELEGRAM',
  INSTAGRAM: 'INSTAGRAM',
  VK: 'VK',
  TIKTOK: 'TIKTOK',
  YOUTUBE: 'YOUTUBE',
  FACEBOOK: 'FACEBOOK',
  TWITTER: 'TWITTER',
  OTHER: 'OTHER',
  DISCORD: 'DISCORD',
  THREADS: 'THREADS',
  REDDIT: 'REDDIT',
  TWITCH: 'TWITCH',
  KICK: 'KICK',
  RUTUBE: 'RUTUBE',
  DZEN: 'DZEN',
  MUSIC: 'MUSIC',
  OK: 'OK',
  LIKEE: 'LIKEE',
  WHATSAPP: 'WHATSAPP',
  SPOTIFY: 'SPOTIFY',
  SOUNDCLOUD: 'SOUNDCLOUD',
  LINKEDIN: 'LINKEDIN',
  PINTEREST: 'PINTEREST',
  SNAPCHAT: 'SNAPCHAT',
  TROVO: 'TROVO',
  KWAI: 'KWAI',
  MESSENGER_MAX: 'MESSENGER_MAX',
  GOOGLE: 'GOOGLE',
  APPLE: 'APPLE',
  YANDEX: 'YANDEX',
  STEAM: 'STEAM',
  RUMBLE: 'RUMBLE',
  TUMBLR: 'TUMBLR',
  VIMEO: 'VIMEO',
  SHAZAM: 'SHAZAM',
  QUORA: 'QUORA',
  MEDIUM: 'MEDIUM',
  WEBSITE: 'WEBSITE',
  PERISCOPE: 'PERISCOPE',
  CLOUDHUB: 'CLOUDHUB',
  AUDIOMACK: 'AUDIOMACK',
  DATPIFF: 'DATPIFF',
  MAX: 'MAX'
} as const;
export type Platform = keyof typeof Platform;

export const Category = {
  SUBSCRIBERS: 'SUBSCRIBERS',
  LIKES: 'LIKES',
  VIEWS: 'VIEWS',
  REACTIONS: 'REACTIONS',
  REPOSTS: 'REPOSTS',
  COMMENTS: 'COMMENTS',
  OTHER: 'OTHER',
  BOOSTS: 'BOOSTS',
  POLLS: 'POLLS',
  STORIES: 'STORIES',
  BOTS: 'BOTS',
  REFERRALS: 'REFERRALS',
  FRIENDS: 'FRIENDS',
  PLAYS: 'PLAYS',
  RECOVER: 'RECOVER',
  PREMIUM: 'PREMIUM',
  TRAFFIC: 'TRAFFIC',
  DISLIKES: 'DISLIKES',
  GROUPS: 'GROUPS',
  STREAMS: 'STREAMS',
  WATCH_TIME: 'WATCH_TIME',
  SAVES: 'SAVES',
  STARS: 'STARS',
  COMPLAINTS: 'COMPLAINTS'
} as const;
export type Category = keyof typeof Category;


export type OrderStatus =
  | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'CANCELED' | 'AWAITING_PAYMENT' | 'IN_PROGRESS';

export type TransactionStatus =
  | 'PENDING' | 'SUCCESS' | 'FAILED' | 'COMPLETED' | 'ERROR';

/**
 * Standardized service response pattern to eliminate ambiguous return types.
 */
export type ServiceResult<T = void> = 
  | { success: true; data: T; meta?: Record<string, any> }
  | { success: false; error: { code: string; message: string; details?: any } };

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

export interface AdminContext {
    userId: string;
    role: 'ADMIN' | 'SUPPORT' | 'SEO';
    allowedProjects: string[];
    isGlobalAdmin: boolean;
}

export type AdminServiceResult<T> = ServiceResult<T>;

/**
 * Common event payloads for the ServiceEventBus.
 * Using types here allows for strict typing in event handlers.
 */
export interface ServiceEvents {
  'TRANSACTION_PENDING': { txId: string; userId: string; amount: number };
  'PAYMENT_CONFIRMED': { txId: string; userId: string; amount: number; orderMetadata?: any; provider?: string };
  'ORDER_CREATED': { orderId: number; externalId?: string; providerId: string };
  'ORDER_COMPLETED': { orderId: number; cost?: number };
  'ORDER_FAILED': { orderId: number; reason: string; canRetry?: boolean };
  'SERVICE_UPDATED': { serviceId: string; changes: string[] };
  'SYSTEM_ALERT': { level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'; message: string; details?: any };
}

export interface MarkupRule {
  providerName?: string;
  category?: Category | string;
  markupPercent: number; // e.g. 30 for 30%
  fixedMarkup: number;   // e.g. 10 for +10 RUB
  minPrice: number;
}

export interface LadderLevel {
  threshold: number;      // Цена закупки, до которой действует этот уровень
  multiplier: number;     // Множитель (например, 2 для 100%)
  fixedMarkup: number;    // Фиксированная наценка в RUB
}

export interface DashboardStats {
  activeCount: number;
  completedCount: number;
  totalSpent: number;
}

export interface CatalogServiceItem {
  id: string;
  name: string;
  description: string;
  requirements: string;
  pricePer1000: number;
  pricePerUnit: number;
  category: string;
  platform: string;
  targetType: string;
  isPrivate: boolean;
  isHot: boolean;
  isCheap: boolean;
  isBest: boolean;
  quality: "HIGH" | "STD";
  minQty: number;
  maxQty: number;
  qtyStep: number;
  numericId?: string;
}



