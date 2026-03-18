/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export interface PaymentCredentials {
    shopId: string;
    secretKey: string;
}

export interface PaymentResult {
    success: boolean;
    paymentId?: string;
    confirmationUrl?: string;
    error?: string;
}

export interface RefundResult {
    success: boolean;
    error?: string;
}


