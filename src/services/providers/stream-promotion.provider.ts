/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import axios from 'axios';
import { Provider } from '@/generated/client';
import { IProvider, ProviderServiceData } from './base-provider';
import { ProviderOrderResult, ProviderStatusResult } from '@/types/orders';
import { validateSafeUrl } from '@/utils/url-validator';

// Реализация, специфичная для Stream Promotion API
export class StreamPromotionProvider implements IProvider {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

  constructor(config: Provider) {
    validateSafeUrl(config.apiUrl, `StreamPromotionProvider(${config.name})`);
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
  }

  private async makeRequest(params: Record<string, any>): Promise<any> {
    const body = new URLSearchParams({
      key: this.apiKey,
      ...params,
    });

    const response = await axios.post(this.apiUrl, body, {
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }


  async getServices(): Promise<ProviderServiceData[]> {
    const data = await this.makeRequest({ action: 'services' });

    // Check for API error response
    if (data && data.error) {
      console.error(`[StreamPromotion] API Error: ${data.error}`);
      throw new Error(`API Error: ${data.error}`);
    }

    if (!Array.isArray(data)) {
      console.error('[StreamPromotion] Invalid response format (expected array):', JSON.stringify(data));
      throw new Error('Invalid services data received from Stream-Promotion');
    }

    return data.map((s: any) => ({
      service: s.service,
      name: s.name,
      type: s.type || 'default',
      category: s.category || 'Other',
      rate: s.rate,
      min: s.min,
      max: s.max,
      dripfeed: !!s.dripfeed
    }));
  }

  async getBalance(): Promise<{ balance: number; currency: string }> {
    const data = await this.makeRequest({ action: 'balance' });
    return {
      balance: parseFloat(data.balance),
      currency: data.currency
    };
  }

  async createOrder(serviceId: number | string, link: string, quantity: number): Promise<ProviderOrderResult> {
    try {
      const data = await this.makeRequest({
        action: 'add',
        service: serviceId.toString(),
        link: link,
        quantity: quantity.toString(),
      });

      if (data && data.order) {
        return {
          success: true,
          externalId: data.order.toString(),
          providerName: 'StreamPromotion',
          rawData: data
        };
      } else {
        return {
          success: false,
          error: data?.error || 'Unknown error from Stream-Promotion API',
          rawData: data
        };
      }
    } catch (error: any) {
      console.error('Error creating Stream-Promotion order:', error.message);
      return {
        success: false,
        error: error.message,
        rawData: error.response?.data
      };
    }
  }

  async getStatus(externalId: string): Promise<ProviderStatusResult> {
    const data = await this.makeRequest({ action: 'status', order: externalId });
    return {
      status: data.status,
      remains: parseInt(data.remains || '0'),
      cost: parseFloat(data.charge || '0'),
      error: data.error
    };
  }

  async cancelOrder(externalId: string): Promise<{ success: boolean; error?: string }> {
    const data = await this.makeRequest({ action: 'cancel', order: externalId });
    if (data && !data.error) {
      return { success: true };
    } else {
      return { success: false, error: data?.error || 'Cancellation failed' };
    }
  }
}
