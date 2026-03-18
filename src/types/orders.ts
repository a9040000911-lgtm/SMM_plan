/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Order, InternalService, User, Project } from '@/generated/client';
import { Decimal } from 'decimal.js';

export interface DripFeedSettings {
    runs: number;
    interval: number;
}

/**
 * Расширенный тип заказа со всеми необходимыми связями.
 */
export type OrderWithRelations = Order & {
    internalService: InternalService;
    user: User;
    project?: Project | null;
};

/**
 * Тип данных для инициации нового заказа.
 */
export interface OrderInitiateData {
    userId: string;
    serviceId: string;
    projectId: string | null;
    link: string;
    qty: number;
    inviteLink?: string;
    totalPrice: Decimal;
    costPrice?: Decimal;
    discountAmount?: Decimal;
    promoId?: string;
    isDripFeed?: boolean;
    dripFeed?: DripFeedSettings;
    tgId?: number;
    username?: string;
    unitName?: string;
    isManual?: boolean;
}

export interface OrderMetadata {
    serviceId?: string;
    qty?: number;
    link?: string;
    inviteLink?: string; // Optional invite link for private channel join
    promoId?: string;
    dripFeed?: DripFeedSettings;

    // Payment specific
    orderId?: string | number; // Matches transaction externalId or similar
    orderIds?: (string | number)[]; // For batch orders
    type?: 'AUTO_REFUND' | 'MANUAL_REFUND';
    bonus?: string;
    note?: string;
    source?: 'WEB' | 'BOT';

    // Deprecated/Legacy
    isAutoOrder?: boolean;
}

export interface ProviderOrderResult {
    success: boolean;
    externalId?: string;
    providerName?: string;
    rawData?: any; // The raw response from provider (still any as it varies wildy)
    error?: string;
}

export interface ProviderStatusResult {
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'CANCELED' | 'ERROR';
    remains: number;
    error?: string;
    cost?: number; // Optional actual cost if provider returns it
}


