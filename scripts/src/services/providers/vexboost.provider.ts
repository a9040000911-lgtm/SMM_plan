/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import axios from 'axios';
import { Provider } from '@/generated/client';
import { IProvider, ProviderServiceData } from './base-provider';
import { ProviderOrderResult, ProviderStatusResult } from '@/types/orders';

// Реализация специфичной для VexBoost логики
export class VexboostProvider implements IProvider {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  // Конструктор принимает конфигурацию из БД
  constructor(config: Provider) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
  }

  // Получение списка услуг
  async getServices(): Promise<ProviderServiceData[]> {
    const response = await axios.get(`${this.apiUrl}?action=services&key=${this.apiKey}`, { timeout: 30000 });

    let services = response.data;
    if (response.data && response.data.value && Array.isArray(response.data.value)) {
      services = response.data.value;
    }

    if (!Array.isArray(services)) {
      throw new Error('Invalid services data received from VexBoost');
    }

    return services;
  }

  // Получение баланса
  async getBalance(): Promise<{ balance: number; currency: string }> {
    const response = await axios.get(`${this.apiUrl}?action=balance&key=${this.apiKey}`, { timeout: 30000 });
    return {
      balance: parseFloat(response.data.balance),
      currency: response.data.currency
    };
  }

  // Создание заказа
  async createOrder(serviceId: number | string, link: string, quantity: number): Promise<ProviderOrderResult> {
    try {
      const params = new URLSearchParams();
      params.append('key', this.apiKey);
      params.append('action', 'add');
      params.append('service', serviceId.toString());
      params.append('link', link);
      params.append('quantity', quantity.toString());

      const response = await axios.post(this.apiUrl, params, { timeout: 30000 });

      if (response.data && response.data.order) {
        return {
          success: true,
          externalId: response.data.order.toString(),
          providerName: 'VexBoost',
          rawData: response.data
        };
      } else {
        return {
          success: false,
          error: response.data?.error || 'Unknown error from VexBoost API',
          rawData: response.data
        };
      }
    } catch (error: any) {
      console.error('Error creating VexBoost order:', error.message);
      return {
        success: false,
        error: error.message,
        rawData: error.response?.data
      };
    }
  }

  // Получение статуса заказа
  async getStatus(externalId: string): Promise<ProviderStatusResult> {
    const response = await axios.get(`${this.apiUrl}?action=status&key=${this.apiKey}&order=${externalId}`, { timeout: 30000 });
    const data = response.data;
    return {
      status: data.status,
      remains: parseInt(data.remains || '0'),
      cost: parseFloat(data.charge || '0'),
      error: data.error
    };
  }

  // Получение статусов нескольких заказов (bulk)
  async getStatuses(externalIds: string[]): Promise<Record<string, ProviderStatusResult>> {
    const response = await axios.get(`${this.apiUrl}?action=status&key=${this.apiKey}&orders=${externalIds.join(',')}`, { timeout: 30000 });
    const results: Record<string, ProviderStatusResult> = {};

    for (const [id, data] of Object.entries(response.data)) {
      if (typeof data === 'string') {
        results[id] = { status: 'CANCELED' as any, remains: 0, error: data };
      } else {
        const d = data as any;
        results[id] = {
          status: d.status,
          remains: parseInt(d.remains || '0'),
          cost: parseFloat(d.charge || '0'),
          error: d.error
        };
      }
    }

    return results;
  }

  // Отмена заказа
  async cancelOrder(externalId: string): Promise<{ success: boolean; error?: string }> {
    const response = await axios.get(`${this.apiUrl}?action=cancel&key=${this.apiKey}&order=${externalId}`, { timeout: 30000 });

    if (response.data && !response.data.error) {
      return { success: true };
    } else {
      return { success: false, error: response.data?.error || 'Cancellation failed' };
    }
  }

  // Докрутка (рефилл) заказа
  async refillOrder(externalId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.get(`${this.apiUrl}?action=refill&key=${this.apiKey}&order=${externalId}`, { timeout: 30000 });
      if (response.data && response.data.refill) {
        return { success: true };
      }
      return { success: false, error: response.data?.error || 'Refill failed or not supported' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
