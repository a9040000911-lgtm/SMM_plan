/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export class RobokassaService {
    /**
     * Получает учетные данные Robokassa для конкретного проекта из БД
     */
    private static async getCredentialsForProject(projectId: string) {
        console.log(`[Robokassa Debug] Fetching settings for project: ${projectId}`);
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { paymentSettings: true, name: true }
        });

        console.log(`[Robokassa Debug] Project found: ${project?.name}`);

        const settings = project?.paymentSettings as any;
        const robokassaSettings = settings?.robokassa || settings || {};

        const merchantLogin = robokassaSettings.merchantLogin || process.env.ROBOKASSA_MERCHANT_LOGIN;
        const password1 = robokassaSettings.password1 || process.env.ROBOKASSA_PASSWORD1;

        if (!merchantLogin || !password1) {
            console.error(`[Robokassa Debug] Missing credentials for project ${projectId}`);
            throw new Error(`Robokassa не настроена для проекта ${project?.name || projectId}. Пожалуйста, настройте Merchant Login и Password1.`);
        }

        const mode = robokassaSettings.mode || settings?.mode || process.env.PAYMENT_MODE || 'PRODUCTION';

        return {
            merchantLogin: merchantLogin,
            password1: mode === 'TEST' && (robokassaSettings.testPassword1 || process.env.ROBOKASSA_TEST_PASSWORD1)
                ? (robokassaSettings.testPassword1 || process.env.ROBOKASSA_TEST_PASSWORD1)
                : password1,
            password2: mode === 'TEST' && (robokassaSettings.testPassword2 || process.env.ROBOKASSA_TEST_PASSWORD2)
                ? (robokassaSettings.testPassword2 || process.env.ROBOKASSA_TEST_PASSWORD2)
                : (robokassaSettings.password2 || process.env.ROBOKASSA_PASSWORD2),
            isTest: mode === 'TEST'
        };
    }

    /**
     * Создает подпись для платежа Robokassa
     */
    private static generateSignature(merchantLogin: string, outSum: string, invId: string, password: string): string {
        const signatureString = `${merchantLogin}:${outSum}:${invId}:${password}`;
        return crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();
    }

    /**
     * Проверяет подпись от Robokassa (для webhook)
     */
    static verifySignature(outSum: string, invId: string, receivedSignature: string, password: string): boolean {
        const signatureString = `${outSum}:${invId}:${password}`;
        const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();
        return expectedSignature === receivedSignature.toUpperCase();
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
        const invId = transactionId;

        // Генерация подписи
        const signature = this.generateSignature(
            credentials.merchantLogin,
            outSum,
            invId,
            credentials.password1
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


