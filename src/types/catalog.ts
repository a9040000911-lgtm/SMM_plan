/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export interface CatalogService {
    id: string;
    name: string;
    description?: string;
    price: number;
    min: number;
    max: number;
    targetType: string;
    guaranteeDays?: number;
    pricePer1000?: number; // compat with V1/V2
}

export interface SerializedServiceV2 {
    id: string;
    numericId: number;
    name: string;
    description: string;
    platform: string;
    category: string;
    pricePer1000: number;
    minQty: number;
    maxQty: number;
    isActive: boolean;
    isCurated: boolean;
    lastProviderPrice: number;
    createdAt: string;
    updatedAt: string;
    providerPriceOriginal: number;
    // Marketing metadata
    isHot?: boolean;
    isCheap?: boolean;
    isBest?: boolean;
    quality?: "HIGH" | "STD";
    // Common fields from internalService that might be serialized
    targetType?: string;
    guaranteeDays?: number;
    markup?: number;
    marketPrice?: number;
}

export interface CatalogCategory {
    services: CatalogService[];
}

export type CatalogData = Record<string, Record<string, CatalogCategory>>;


