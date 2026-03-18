/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
// services/providers/base-provider.ts
import { ProviderOrderResult, ProviderStatusResult } from '@/types/orders';

// Определяем, как выглядят данные услуги, возвращаемые провайдером
export interface ProviderServiceData {
  service: string | number;
  name: string;
  type?: string;
  category?: string;
  rate: string | number;
  min: string | number;
  max: string | number;
  dripfeed?: boolean;
  [key: string]: any; // Позволяет иметь другие поля
}

// Определяем общий контракт (интерфейс) для всех провайдеров
export interface IProvider {
  // Метод для получения полного списка услуг
  getServices(): Promise<ProviderServiceData[]>;

  // Метод для создания нового заказа
  createOrder(serviceId: number | string, link: string, quantity: number, extraParams?: Record<string, any>): Promise<ProviderOrderResult>;

  // Метод для получения статуса заказа
  getStatus(externalId: string): Promise<ProviderStatusResult>;

  // Метод для получения статусов нескольких заказов (bulk)
  getStatuses?(externalIds: string[]): Promise<Record<string, ProviderStatusResult>>;

  // Метод для получения баланса
  getBalance(): Promise<{ balance: number; currency: string }>;

  // Метод для отмены заказа (если поддерживается)
  cancelOrder?(externalId: string): Promise<{ success: boolean; error?: string }>;

  // Метод для докрутки (восстановления) заказа
  refillOrder?(externalId: string): Promise<{ success: boolean; error?: string }>;
}


