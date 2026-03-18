/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { User, InternalService, Platform, OrderStatus, Category } from '@/generated/client';
import React from 'react';

// Type aliases for admin panel use
export type AdminUser = Pick<User, 'id' | 'username' | 'role' | 'earlyBirdRank' | 'tgId' | 'allowedTabs'>;

export type AdminService = InternalService;

// Serialized order for client-side use (after toPlainObject)
export interface AdminOrder {
    id: number;
    externalId: string | null;
    link: string;
    quantity: number;
    totalPrice: number;
    discountAmount: number | null;
    costPrice: number | null;
    refundedAmount: number;
    status: OrderStatus;
    providerName: string | null;
    comments: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    isDripFeed: boolean;
    currentRun: number;
    runs: number;
    interval: number;
    nextRunAt: Date | string | null;
    providerRawResponse?: any;
    userId: string;
    user: {
        id: string;
        username: string | null;
        email: string | null;
        tgId: string | null;
    };
    projectId: string | null;
    project?: {
        id: string;
        name: string;
        brandColor: string | null;
    } | null;
    internalServiceId: string;
    internalService: {
        id: string;
        name: string;
        platform: Platform;
        category: Category;
        providerMappings?: Array<{
            id: string;
            providerId: string;
            providerServiceId: string;
            provider: {
                id: string;
                name: string;
                apiUrl?: string;
            }
        }>;
    };
}

export interface AdminStats {
    revenue: number;
    orderCount: number;
    pendingPaymentsCount: number;
    canceledCount: number;
    stuckOrdersCount: number;
    openTicketsCount: number;
    newTicketsCount: number;
    latestOrders: AdminOrder[];
    stuckOrders: AdminOrder[];
    financialAudit?: {
        discrepanciesCount: number;
        timestamp: Date;
    };
}

// UI Props Types
export interface NavItemProps {
    name: string;
    href: string;
    icon: React.ElementType;
}

// Provider type for admin panel
export interface AdminProvider {
    id: string;
    projectId?: string | null;
    name: string;
    type: string;
    apiKey: string;
    apiUrl: string;
    isEnabled: boolean;
    balanceThreshold: number;
    currentBalance: number;
    lastSync?: string | null;
    metadata: unknown;
    serviceCount?: number;
    _count: {
        balanceLogs: number;
        services?: number;
    };
    latency?: number;
    avgSpeed?: number;
    apiHealth?: 'UP' | 'DOWN' | 'SLOW' | 'UNKNOWN';
    balanceCurrency?: 'RUB' | 'USD' | string;
    pricesCurrency?: 'RUB' | 'USD' | string;
}

// Provider mapping serialized version
export interface SerializedMapping {
    id: string;
    priority: number;
    isActive: boolean;
    providerId: string;
    providerServiceId: string;
    provider: {
        id: string;
        name: string;
        type: string;
        balanceThreshold: number;
    } | null;
    providerService: {
        id: string;
        name: string;
        rawPrice: number;
        rawPriceOriginal?: number | null;
        rawCurrencyOriginal?: string | null;
        rawData?: unknown;
    } | null;
}

// Project override serialized version
export interface SerializedOverride {
    id: string;
    projectId: string;
    internalServiceId: string;
    customPrice: number | null;
    markup: number | null;
    isActive: boolean;
    customDescription: string | null;
    customMaxQty: number | null;
    customMinQty: number | null;
    customName: string | null;
    customRequirements: string | null;
}

// Service category serialized version
export interface SerializedServiceCategory {
    id: string;
    name: string;
    icon: string | null;
}

// Serialized internal service for client-side use
export interface SerializedService {
    id: string;
    name: string;
    description: string;
    pricePer1000: number;
    lastProviderPrice: number | null;
    marketPrice: number | null;
    markup: number | null;
    isActive: boolean;
    platform: Platform;
    category: Category;
    targetType: string;
    allowedTargetTypes: string[];
    requirements: string | null;
    guaranteeDays: number;
    successRate: number;
    isPrivate: boolean;
    categoryId: string | null;
    minQty: number;
    maxQty: number;
    providerPriceOriginal: number | null;
    providerCurrencyOriginal: string | null;
    providerMappings: SerializedMapping[];
    serviceCategory?: SerializedServiceCategory;
    _count?: {
        orders: number;
    };
}


