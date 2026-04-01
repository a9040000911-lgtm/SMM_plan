/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
"use server";

import { prisma } from "@/lib/prisma";
import { getClientProjectId } from "@/utils/project-resolver";
import { Category, Platform } from "@prisma/client";
import { ProjectService } from "@/services/core";

export async function getStrategyServices(platform: string, strategyId?: string) {
    const projectId = await getClientProjectId();
    if (!projectId) return { success: false, error: "Project context missing" };

    try {
        const platformUpper = platform.toUpperCase() as Platform;
        
        let subServiceId: string | undefined;
        let viewServiceId: string | undefined;
        let reactionServiceId: string | undefined;

        // Check for project overrides
        const project = await ProjectService.getById(projectId);
        const config = (project?.config as any) || {};
        const strategies = config.growthSimulator || [];
        const strategy = strategies.find((s: any) => s.id === strategyId);

        if (strategy?.serviceOverrides) {
            subServiceId = strategy.serviceOverrides.sub;
            viewServiceId = strategy.serviceOverrides.view;
            reactionServiceId = strategy.serviceOverrides.reaction;
        }

        // If not all overridden, find best ones
        if (!subServiceId || !viewServiceId || !reactionServiceId) {
            const categoriesToFind: Category[] = [];
            if (!subServiceId) categoriesToFind.push(Category.SUBSCRIBERS);
            if (!viewServiceId) categoriesToFind.push(Category.VIEWS);
            if (!reactionServiceId) categoriesToFind.push(Category.REACTIONS);

            const services = await prisma.internalService.findMany({
                where: {
                    socialPlatform: { slug: platform.toLowerCase() },
                    isActive: true,
                    serviceCategory: { categoryType: { in: categoriesToFind } }
                },
                include: { serviceCategory: true },
                orderBy: { rating: 'desc' },
                take: 20
            });

            if (!subServiceId) subServiceId = services.find(s => s.serviceCategory?.categoryType === Category.SUBSCRIBERS)?.id;
            if (!viewServiceId) viewServiceId = services.find(s => s.serviceCategory?.categoryType === Category.VIEWS)?.id;
            if (!reactionServiceId) reactionServiceId = services.find(s => s.serviceCategory?.categoryType === Category.REACTIONS)?.id;
        }

        const result = { subServiceId, viewServiceId, reactionServiceId };

        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
