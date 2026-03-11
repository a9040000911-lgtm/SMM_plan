/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import axios from 'axios';
import { Provider } from '@/generated/client';
import { IProvider, ProviderServiceData } from './base-provider';
import { ProviderOrderResult, ProviderStatusResult } from '@/types/orders';
import {
  ProviderBalanceSchema,
  ProviderServicesResponseSchema,
  ProviderOrderResponseSchema
} from '@/lib/schemas';

export class UniversalProvider implements IProvider {
  private config: Provider;
  private metadata: any;

  constructor(config: Provider) {
    this.config = config;
    this.metadata = config.metadata || {};
  }

  private async makeRequest(action: string, params: any = {}) {
    const method = (this.metadata.method || 'POST').toLowerCase();
    const requestType = this.metadata.requestType || 'form';

    const keyField = this.metadata.keyField || 'key';
    const actionField = this.metadata.actionField || 'action';

    const actionMap: any = this.metadata.actionMap || {};
    const finalAction = actionMap[action] || action;

    const fullParams = {
      [keyField]: this.config.apiKey,
      [actionField]: finalAction,
      ...params
    };

    const headers: Record<string, string> = this.metadata.headers || {};
    const url = this.config.apiUrl;
    const timeout = this.metadata.timeout || 60000;
    const useFetch = this.metadata.useFetch || false;

    console.log(`[UniversalProvider:${this.config.name}] Requesting ${url} (Action: ${finalAction})...`);

    try {
      if (useFetch) {
        const fetchMethod = method.toUpperCase();
        let fetchUrl = url;
        let fetchBody: any = null;

        if (fetchMethod === 'GET') {
          const searchParams = new URLSearchParams();
          Object.entries(fullParams).forEach(([k, v]) => searchParams.append(k, String(v)));
          fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + searchParams.toString();
        } else {
          if (requestType === 'json') {
            fetchBody = JSON.stringify(fullParams);
            headers['Content-Type'] = 'application/json';
          } else {
            const formData = new URLSearchParams();
            Object.entries(fullParams).forEach(([k, v]) => formData.append(k, String(v)));
            fetchBody = formData;
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
          }
        }

        const response = await fetch(fetchUrl, {
          method: fetchMethod,
          body: fetchBody,
          headers,
          // Node.js fetch doesn't have a direct timeout option like axios, but we can use AbortController if needed.
          // For now, let's keep it simple as smmpanelus.com worked with fetch without explicit timeout.
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      }

      if (method === 'get') {
        return (await axios.get(url, { params: fullParams, headers, timeout })).data;
      } else {
        if (requestType === 'json') {
          return (await axios.post(url, fullParams, {
            headers: { ...headers, 'Content-Type': 'application/json' },
            timeout
          })).data;
        } else {
          const formData = new URLSearchParams();
          Object.entries(fullParams).forEach(([k, v]) => formData.append(k, String(v)));
          return (await axios.post(url, formData, {
            headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout
          })).data;
        }
      }
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      const statusCode = error.response?.status;
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('aborted');
      const isRetryable = isTimeout || (statusCode && statusCode >= 500);
      const isNotFound = error.code === 'ENOTFOUND' || (statusCode === 404);

      console.error(`[UniversalProvider:${this.config.name}] API Error (Status: ${statusCode}):`, errorData);

      if (isRetryable) {
        throw new Error(`PROVIDER_NETWORK_ERROR: ${error.message || 'Timeout/5xx'}`);
      }

      if (isNotFound && error.code === 'ENOTFOUND') {
        throw new Error(`DNS Resolution failed (ENOTFOUND). Please check provider URL: ${url}`);
      }

      throw error;
    }
  }

  async getBalance(): Promise<{ balance: number; currency: string }> {
    const data = await this.makeRequest('balance');
    const validated = ProviderBalanceSchema.parse(data);
    return {
      balance: validated.balance,
      currency: validated.currency
    };
  }

  async getServices(): Promise<ProviderServiceData[]> {
    const data = await this.makeRequest('services');

    // Поддержка вложенности в поле 'value' (как у VexBoost)
    const rawServices = Array.isArray(data) ? data : (data.value && Array.isArray(data.value)) ? data.value : [];

    const validated = ProviderServicesResponseSchema.parse(rawServices);

    return validated.map(s => ({
      service: s.service,
      name: s.name,
      type: s.type || 'default',
      category: s.category || 'Other',
      soc: s.soc,
      rate: s.rate,
      min: s.min,
      max: s.max,
      description: s.description || ''
    }));
  }

  async createOrder(serviceId: number | string, link: string, quantity: number, extra: any = {}): Promise<ProviderOrderResult> {
    try {
      const data = await this.makeRequest('add', {
        service: serviceId,
        link: link,
        quantity: quantity,
        ...extra
      });

      const validated = ProviderOrderResponseSchema.parse(data);

      if (validated.order) {
        return { success: true, externalId: String(validated.order), providerName: this.config.name, rawData: data };
      }
      return { success: false, error: validated.error || 'Unknown error', rawData: data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async getStatus(externalId: string): Promise<ProviderStatusResult> {
    try {
      const data = await this.makeRequest('status', { order: externalId });
      return {
        status: data.status,
        remains: parseInt(data.remains || '0'),
        cost: parseFloat(data.charge || '0'),
        error: data.error
      };
    } catch (e: any) {
      if (e.response?.status === 404) {
        return { status: 'CANCELED', remains: 0, cost: 0, error: 'Order not found on provider (404)' };
      }
      throw e;
    }
  }

  async getStatuses(externalIds: string[]): Promise<Record<string, ProviderStatusResult>> {
    try {
      const data = await this.makeRequest('status', { orders: externalIds.join(',') });
      const results: Record<string, ProviderStatusResult> = {};

      for (const [id, orderData] of Object.entries(data)) {
        if (typeof orderData === 'string') {
          results[id] = { status: 'CANCELED' as any, remains: 0, error: orderData };
        } else {
          const d = orderData as any;
          results[id] = {
            status: d.status,
            remains: parseInt(d.remains || '0'),
            cost: parseFloat(d.charge || '0'),
            error: d.error
          };
        }
      }
      return results;
    } catch (e: any) {
      console.error(`[UniversalProvider:${this.config.name}] Bulk status error:`, e.message);
      // Return individual errors if bulk fails
      return {};
    }
  }

  async refillOrder(externalId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await this.makeRequest('refill', { order: externalId });
      if (data.refill) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Refill not supported or failed' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
