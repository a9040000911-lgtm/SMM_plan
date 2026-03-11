"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { getClientProjectId } from "@/utils/project-resolver";

export async function getInstantServices() {
    const projectId = await getClientProjectId();
    if (!projectId) return [];

    const services = await prisma.internalService.findMany({
        where: {
            isActive: true,
            OR: [
                { providerMappings: { some: { projectId } } },
                { projectOverrides: { some: { projectId, isActive: true } } }
            ]
        },
        select: {
            id: true,
            name: true,
            description: true,
            pricePer1000: true,
            category: true,
            platform: true,
            minQty: true,
            maxQty: true,
            requirements: true,
            targetType: true,
            isPrivate: true,
            projectOverrides: {
                where: { projectId },
                select: {
                    customPrice: true,
                    customName: true,
                    customDescription: true,
                    customRequirements: true,
                    isActive: true
                }
            }
        },
        orderBy: {
            pricePer1000: 'asc',
        },
    });

    const formattedServices = services.map(s => {
        const override = s.projectOverrides?.[0];
        const finalPricePer1000 = override?.customPrice ? Number(override.customPrice) : Number(s.pricePer1000);
        // Расчет цены за 1 штуку
        const pricePerUnit = Number((finalPricePer1000 / 1000).toFixed(4));

        return {
            id: s.id,
            name: override?.customName || s.name,
            description: override?.customDescription || s.description,
            requirements: override?.customRequirements || s.requirements,
            pricePer1000: finalPricePer1000,
            pricePerUnit: pricePerUnit,
            category: s.category,
            platform: s.platform,
            targetType: s.targetType,
            isPrivate: s.isPrivate,
            // Мета-теги для Smart Badges v4.0
            isHot: s.name.toLowerCase().includes("premium") || s.name.toLowerCase().includes("fast"),
            isCheap: finalPricePer1000 < 50,
            isBest: s.name.toLowerCase().includes("garant") || s.name.toLowerCase().includes("гарант"),
            quality: s.name.toLowerCase().includes("hq") ? "HIGH" : "STD"
        };
    });

    return formattedServices;
}
