/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */


export interface PaymentConfirmedPayload {
    txId: string;
    userId: string;
    amount: number; // For event bus simplicity, but handlers convert to Decimal
    orderMetadata?: any;
    provider?: string;
}

export interface OrderUpdatePayload {
    orderId: number;
    status: string;
    remains?: number;
    externalId?: string;
}

export interface OrderFailurePayload {
    orderId: number;
    reason: string;
    canRetry?: boolean;
}

export interface SystemAlertPayload {
    level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    message: string;
    context?: any;
}

export interface EventBusContract {
    'PAYMENT_CONFIRMED': PaymentConfirmedPayload;
    'ORDER_COMPLETED': OrderUpdatePayload;
    'ORDER_FAILED': OrderFailurePayload;
    'SYSTEM_ALERT': SystemAlertPayload;
    'ORDER_CREATED': { orderId: number; userId: string };
}


