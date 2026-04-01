/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
"use server";

import { CatalogService } from "@/services/core/catalog.service";
import { getClientProjectId } from "@/utils/project-resolver";

export async function getInstantServices(projectId?: string, platform?: string | null) {
    const targetProjectId = projectId || await getClientProjectId();
    if (!targetProjectId) return [];

    const result = await CatalogService.getAvailableByPlatform(targetProjectId, platform);

    if (result.success) {
        // Aggressive plain object conversion to prevent "prototype" enum errors in Next.js 15 serialization
        // This ensures no Prisma-internal properties or prototype links leak to the client component.
        return result.data.map((s: any) => ({
            id: String(s.id),
            numericId: s.numericId ? String(s.numericId) : String(s.id).split('_').pop(),
            name: String(s.name),
            description: String(s.description || ""),
            requirements: String(s.requirements || ""),
            pricePer1000: Number(s.pricePer1000),
            pricePerUnit: Number(s.pricePerUnit),
            category: String(s.category),
            platform: String(s.platform),
            targetType: String(s.targetType || "ALL"),
            isPrivate: Boolean(s.isPrivate),
            isHot: Boolean(s.isHot),
            isCheap: Boolean(s.isCheap),
            isBest: Boolean(s.isBest),
            quality: String(s.quality) as "HIGH" | "STD",
            minQty: Number(s.minQty),
            maxQty: Number(s.maxQty),
            qtyStep: Number(s.qtyStep)
        }));
    } else {
        console.error(`[getInstantServices] Catalog fetch failed: ${result.error.message}`);
        return [];
    }
}
