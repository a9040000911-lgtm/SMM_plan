/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import axios from 'axios';
import * as crypto from 'crypto';
import { ConfigService } from '@/services/core/config.service';
import { PaymentResult, RefundResult } from '@/types/payment';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

export class PaymentService {
  private static async getAuthHeader(customShopId?: string, customSecretKey?: string) {
    let shopId = customShopId;
    let secretKey = customSecretKey;

    if (!shopId || !secretKey) {
      // Fallback to system config
      const sysConfig = await ConfigService.getPaymentConfig();
      if (!shopId) shopId = sysConfig.shopId;
      if (!secretKey) secretKey = sysConfig.secretKey;
    }

    if (!shopId || !secretKey) {
      console.error('--- PAYMENT AUTH ERROR ---');
      console.error(`shopId: ${shopId ? 'PRESENT' : 'MISSING'}`);
      console.error(`secretKey: ${secretKey ? 'PRESENT' : 'MISSING'}`);
      throw new Error('YooKassa credentials (Shop ID / Secret Key) are missing for this project');
    }

    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    return `Basic ${auth}`;
  }

  static async createPayment(
    amount: number,
    description: string,
    orderId: number | string,
    credentials?: { shopId: string, secretKey: string },
    returnUrl?: string,
    source: 'WEB' | 'BOT' = 'BOT',
    userEmail?: string
  ): Promise<PaymentResult> {
    try {
      const idempotenceKey = crypto.randomUUID();
      const telegramConfig = await ConfigService.getTelegramConfig();
      const defaultReturnUrl = `https://t.me/${telegramConfig.username}`;

      const legalDescription = 'Пополнение личного кабинета пользователя';

      const response = await axios.post(
        YOOKASSA_API_URL,
        {
          amount: {
            value: amount.toFixed(2),
            currency: 'RUB',
          },
          confirmation: {
            type: 'redirect',
            return_url: returnUrl || defaultReturnUrl,
          },
          capture: true,
          description: legalDescription,
          metadata: {
            order_id: orderId.toString(),
            original_description: description, // Keep original for backend
            source: source // For Analytics
          },
          ...(userEmail && {
            receipt: {
              customer: {
                email: userEmail
              },
              items: [
                {
                  description: legalDescription,
                  quantity: '1.00',
                  amount: {
                    value: amount.toFixed(2),
                    currency: 'RUB'
                  },
                  vat_code: '1',
                  payment_mode: 'full_payment',
                  payment_subject: 'service'
                }
              ]
            }
          })
        },
        {
          headers: {
            'Authorization': await this.getAuthHeader(credentials?.shopId, credentials?.secretKey),
            'Idempotence-Key': idempotenceKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        confirmationUrl: response.data.confirmation.confirmation_url,
      };
    } catch (error) {
      const err = error as any;
      const errorData = err.response?.data;
      console.error('--- YOOKASSA API ERROR (Create) ---');
      console.error('Status:', err.response?.status);
      console.error('Details:', JSON.stringify(errorData, null, 2));
      console.error('Message:', err.message);

      return {
        success: false,
        error: errorData?.description || err.message,
      };
    }
  }

  static async getPaymentStatus(paymentId: string, credentials?: { shopId: string, secretKey: string }): Promise<{ success: boolean; status: string; raw?: any }> {
    try {
      const response = await axios.get(`${YOOKASSA_API_URL}/${paymentId}`, {
        headers: {
          'Authorization': await this.getAuthHeader(credentials?.shopId, credentials?.secretKey),
        },
        timeout: 10000,
      });

      const status = response.data.status;
      return {
        success: status === 'succeeded',
        status: status,
        raw: response.data
      };
    } catch (error) {
      const err = error as any;
      console.error('--- YOOKASSA API ERROR (Status) ---');
      console.error('ID:', paymentId);
      console.error('Details:', err.response?.data || err.message);
      return { success: false, status: 'error', raw: err.response?.data };
    }
  }

  /**
   * Создает возврат в YooKassa
   */
  static async createRefund(
    paymentId: string,
    amount: number,
    description: string,
    credentials?: { shopId: string, secretKey: string }
  ): Promise<RefundResult> {
    try {
      const idempotenceKey = crypto.randomUUID();
      const REFUND_URL = 'https://api.yookassa.ru/v3/refunds';

      const response = await axios.post(
        REFUND_URL,
        {
          payment_id: paymentId,
          amount: {
            value: amount.toFixed(2),
            currency: 'RUB',
          },
          description: description,
        },
        {
          headers: {
            'Authorization': await this.getAuthHeader(credentials?.shopId, credentials?.secretKey),
            'Idempotence-Key': idempotenceKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return {
        success: response.data.status === 'succeeded' || response.data.status === 'pending',
      };
    } catch (error) {
      const err = error as any;
      console.error('--- YOOKASSA API ERROR (Refund) ---');
      console.error('Details:', err.response?.data || err.message);
      return {
        success: false,
        error: err.response?.data?.description || err.message,
      };
    }
  }
}


