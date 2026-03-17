/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Platform, Category, OrderStatus, TransactionStatus } from '@/generated/client';

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
  'PAYMENT_CONFIRMED': { txId: string; userId: string; amount: number; orderMetadata?: any };
  'ORDER_CREATED': { orderId: number; externalId?: string; providerId: string };
  'ORDER_COMPLETED': { orderId: number; cost?: number };
  'ORDER_FAILED': { orderId: number; reason: string };
  'SERVICE_UPDATED': { serviceId: string; changes: string[] };
  'SYSTEM_ALERT': { level: 'INFO' | 'WARN' | 'ERROR'; message: string; details?: any };
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
}

/**
 * Re-exporting core Enums for convenience to make this file the primary destination
 * for service-layer types and prevent importing generated client in leafs.
 */
export { Platform, Category, OrderStatus, TransactionStatus };
