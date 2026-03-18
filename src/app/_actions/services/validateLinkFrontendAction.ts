"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { CatalogService } from "@/services/core/catalog.service";

export async function validateLinkFrontendAction(link: string, serviceId: string) {
    const result = await CatalogService.validateLink(link, serviceId);
    
    if (!result.success) {
        console.error("Link frontend validation action error:", result.error.message);
        return { success: false, error: result.error.message };
    }

    return { success: true, validation: result.data };
}


