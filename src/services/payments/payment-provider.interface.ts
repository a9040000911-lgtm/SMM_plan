/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Unified interface for payment providers
 */
export interface IPaymentProvider {
    /**
     * Creates a payment and returns confirmation URL
     */
    createPayment(
        projectId: string,
        amount: number,
        transactionId: string,
        description: string,
        userEmail?: string
    ): Promise<{
        id: string;
        status: string;
        confirmationUrl: string;
    }>;

    /**
     * Verifies webhook signature (if applicable)
     */
    verifyWebhook?(data: Record<string, any>): Promise<boolean>;
}

export type PaymentProviderType = 'YOOKASSA' | 'ROBOKASSA';
