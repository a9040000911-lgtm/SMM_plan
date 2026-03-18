"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { CatalogService } from "@/services/core/catalog.service";

export async function analyzePremiumLink(link: string) {
    const result = await CatalogService.analyzePremiumLink(link);
    if (!result.success) return { error: result.error.message };
    return result.data;
}

export async function getPremiumServices(platform?: string) {
    const result = await CatalogService.getPremiumServices(platform);
    if (!result.success) return [];
    return result.data;
}


