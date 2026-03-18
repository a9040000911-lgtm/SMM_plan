/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export class YooKassaService {
  /**
   * Получает учетные данные ЮKassa для конкретного проекта из БД
   */
  private static async getCredentialsForProject(projectId: string) {
    console.log(`[YooKassa Debug] Fetching settings for project: ${projectId}`);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { paymentSettings: true, name: true }
    });

    console.log(`[YooKassa Debug] Project found: ${project?.name}, settings:`, JSON.stringify(project?.paymentSettings));

    const settings = project?.paymentSettings as any;
    const shopId = settings?.yookassaShopId || settings?.shopId || process.env.YOOKASSA_SHOP_ID;
    const secretKey = settings?.yookassaSecretKey || settings?.secretKey || process.env.YOOKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
      console.error(`[YooKassa Debug] Missing credentials for project ${projectId}. Settings:`, settings);
      throw new Error(`ЮKassa не настроена для проекта ${project?.name || projectId}. Пожалуйста, настройте Shop ID и Secret Key.`);
    }

    return Buffer.from(`${shopId}:${secretKey}`).toString('base64');
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


