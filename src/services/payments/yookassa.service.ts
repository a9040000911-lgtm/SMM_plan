/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import axios from 'axios';
import crypto from 'crypto';

export class YooKassaService {
  /**
   * Получает учетные данные ЮKassa для конкретного проекта через PaymentSettingsService
   */
  private static async getCredentialsForProject(projectId: string) {
    const { PaymentSettingsService } = await import('./payment-settings.service');
    const credentials = await PaymentSettingsService.getCredentials<{ shopId: string, secretKey: string }>(projectId, 'YOOKASSA');

    if (!credentials.shopId || !credentials.secretKey) {
      throw new Error(`ЮKassa не настроена. Пожалуйста, проверьте настройки в админ-панели.`);
    }

    return Buffer.from(`${credentials.shopId}:${credentials.secretKey}`).toString('base64');
  }

  /**
   * Создает платеж в ЮKassa
   */
  static async createPayment(projectId: string, amount: number, orderId: number | string, description: string, returnUrl: string, userEmail?: string) {
    const auth = await this.getCredentialsForProject(projectId);
    const idempotenceKey = crypto.randomUUID();

    try {
      const response = await axios.post(
        'https://api.yookassa.ru/v3/payments',
        {
          amount: {
            value: amount.toFixed(2),
            currency: 'RUB',
          },
          capture: true,
          confirmation: {
            type: 'redirect',
            return_url: returnUrl,
          },
          description: description,
          metadata: {
            orderId: orderId.toString(),
            projectId: projectId
          },
          ...(userEmail && {
            receipt: {
              customer: {
                email: userEmail
              },
              items: [
                {
                  description: description,
                  quantity: '1.00',
                  amount: {
                    value: amount.toFixed(2),
                    currency: 'RUB'
                  },
                  vat_code: '1', // Без НДС или по умолчанию. Можно вынести в настройки.
                  payment_mode: 'full_payment',
                  payment_subject: 'service'
                }
              ]
            }
          })
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Idempotence-Key': idempotenceKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id,
        status: response.data.status,
        confirmationUrl: response.data.confirmation.confirmation_url,
      };
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error(`[YooKassa Error Project ${projectId}]:`, errorData || error.message);

      if (errorData?.code === 'invalid_credentials') {
        throw new Error('Ошибка авторизации в ЮKassa: Проверьте Shop ID и Секретный ключ в настройках проекта');
      }

      throw new Error(errorData?.description || 'Ошибка при создании платежа в ЮKassa');
    }
  }
}


