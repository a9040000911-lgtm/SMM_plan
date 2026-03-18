"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getClientProjectId } from "@/utils/project-resolver";
import { CatalogService } from "@/services/core/catalog.service";

export async function getInstantServices() {
    const projectId = await getClientProjectId();
    if (!projectId) return [];

    const result = await CatalogService.getAvailableServices(projectId);

    if (result.success) {
        return result.data;
    } else {
        console.error(`[getInstantServices] Catalog fetch failed: ${result.error.message}`);
        return [];
    }
}


