"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { LinkService } from "@/services/providers/link.service";
import prisma from "@/lib/prisma";
import { Platform } from "@/generated/client";

export async function validateLinkFrontendAction(link: string, serviceId: string) {
    try {
        const service = await prisma.internalService.findUnique({
            where: { id: serviceId },
            select: { platform: true, targetType: true, allowedTargetTypes: true }
        });

        if (!service) return { success: false, error: "Service not found" };

        const validation = await LinkService.validate(
            link,
            service.platform as Platform,
            service.targetType,
            service.allowedTargetTypes || undefined
        );

        return { success: true, validation };
    } catch (error) {
        console.error("Link frontend validation action error:", error);
        return { success: false, error: "An error occurred during link validation" };
    }
}
