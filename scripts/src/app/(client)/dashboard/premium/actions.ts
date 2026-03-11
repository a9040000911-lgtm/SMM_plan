"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { analyzeLink } from "@/utils/link-analyzer";
import { prisma } from "@/lib/prisma";

export async function analyzePremiumLink(link: string) {
    const analysis = analyzeLink(link);
    if (!analysis) return { error: "Не удалось определить платформу" };

    const project = await prisma.project.findUnique({ where: { slug: "smmplan-elite" } });
    if (!project) return { error: "Проект Elite не найден" };

    // Поиск услуг в оверрайдах проекта
    const overrides = await prisma.projectServiceOverride.findMany({
        where: {
            projectId: project.id,
            isActive: true,
            internalService: {
                platform: analysis.platform,
                category: { in: analysis.possibleCategories },
            }
        },
        include: { internalService: true },
        take: 5,
    });

    return {
        platform: analysis.platform,
        objectType: analysis.objectType,
        suggestedServices: overrides.map(o => ({
            id: o.internalService.id,
            name: o.customName || o.internalService.name,
            description: o.customDescription || o.internalService.description,
            price: Number(o.customPrice || o.internalService.pricePer1000)
        }))
    };
}

export async function getPremiumServices(platform?: string) {
    const project = await prisma.project.findUnique({ where: { slug: "smmplan-elite" } });
    if (!project) return [];

    const overrides = await prisma.projectServiceOverride.findMany({
        where: {
            projectId: project.id,
            isActive: true,
            ...(platform && platform !== 'all' ? { internalService: { platform: platform as any } } : {})
        },
        include: { internalService: true },
        orderBy: { internalService: { rating: 'desc' } }
    });

    return overrides.map(o => ({
        id: o.internalService.id,
        name: o.customName || o.internalService.name,
        desc: o.customDescription || o.internalService.description,
        price: `${Number(o.customPrice || o.internalService.pricePer1000)} ₽`,
        platform: o.internalService.platform
    }));
}
