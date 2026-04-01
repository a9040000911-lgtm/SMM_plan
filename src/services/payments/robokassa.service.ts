/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import crypto from 'crypto';

export class RobokassaService {
    /**
     * Получает учетные данные Robokassa через PaymentSettingsService
     */
    private static async getCredentialsForProject(projectId: string) {
        const { PaymentSettingsService } = await import('./payment-settings.service');
        const credentials = await PaymentSettingsService.getCredentials<any>(projectId, 'ROBOKASSA');

        if (!credentials.merchantLogin || !credentials.password1) {
            throw new Error(`Robokassa не настроена. Пожалуйста, проверьте настройки в админ-панели.`);
        }

        return {
            merchantLogin: credentials.merchantLogin,
            password1: credentials.mode === 'TEST' && credentials.testPassword1
                ? credentials.testPassword1
                : credentials.password1,
            password2: credentials.mode === 'TEST' && credentials.testPassword2
                ? credentials.testPassword2
                : (credentials.password2 || ''),
            isTest: credentials.mode === 'TEST'
        };
    }

    /**
     * Создает подпись для платежа Robokassa
     */
    private static generateSignature(merchantLogin: string, outSum: string, invId: string, password: string, shpTxId?: string): string {
        let signatureString = `${merchantLogin}:${outSum}:${invId}:${password}`;
        if (shpTxId) {
            signatureString += `:Shp_txId=${shpTxId}`;
        }
        return crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();
    }

    /**
     * Проверяет подпись от Robokassa (для webhook)
     */
    static verifySignature(outSum: string, invId: string, receivedSignature: string, password: string, shpTxId?: string): boolean {
        let signatureString = `${outSum}:${invId}:${password}`;
        if (shpTxId) {
            signatureString += `:Shp_txId=${shpTxId}`;
        }
        const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();
        const received = receivedSignature.trim().toUpperCase();
        // [SECURITY] Use timing-safe comparison to prevent timing attacks
        if (expectedSignature.length !== received.length) return false;
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(received));
    }

    /**
     * Создает платеж в Robokassa
     */
    static async createPayment(
        projectId: string,
        amount: number,
        transactionId: string,
        description: string,
        email?: string
    ) {
        const credentials = await this.getCredentialsForProject(projectId);

        const outSum = amount.toFixed(2);
        const invId = '0'; // UUID is too large/string, use 0 and pass UUID via Shp_txId
        const shpTxId = transactionId;

        // Генерация подписи
        const signature = this.generateSignature(
            credentials.merchantLogin,
            outSum,
            invId,
            credentials.password1,
            shpTxId
        );

        // Формирование URL для редиректа
        const baseUrl = credentials.isTest
            ? 'https://auth.robokassa.ru/Merchant/Index.aspx'
            : 'https://auth.robokassa.ru/Merchant/Index.aspx';

        // Формирование фискального чека (FZ-54)
        const receipt = {
            sno: 'usn_income', // Система налогообложения (упрощенная)
            items: [
                {
                    name: description,
                    quantity: 1,
                    sum: amount,
                    payment_method: 'full_payment',
                    payment_object: 'service',
                    tax: 'none' // Без НДС
                }
            ]
        };

        const params = new URLSearchParams({
            MerchantLogin: credentials.merchantLogin,
            OutSum: outSum,
            InvId: invId,
            Description: description,
            SignatureValue: signature,
            Shp_txId: shpTxId,
            ...(credentials.isTest && { IsTest: '1' }),
            ...(email && { Email: email }),
            Culture: 'ru',
            Receipt: JSON.stringify(receipt)
        });

        const confirmationUrl = `${baseUrl}?${params.toString()}`;

        console.log(`[Robokassa] Payment URL generated for transaction ${transactionId}`);

        return {
            id: invId, // Robokassa использует InvId как идентификатор
            status: 'pending',
            confirmationUrl,
        };
    }
}


