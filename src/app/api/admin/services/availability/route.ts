/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';
import { SmartAnalyzerService } from '@/services/providers/smart-analyzer.service';

export async function POST(req: Request) {
    try {
        const session = await getAdminSession();
        if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { serviceId, projectIds } = await req.json();

        if (!serviceId || !Array.isArray(projectIds)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // 0. Get service data first
        const service = await prisma.internalService.findUnique({
            where: { id: serviceId },
            select: { platform: true, category: true, targetType: true }
        });
        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

        // 1. Get all projects
        const allProjects = await prisma.project.findMany({ select: { id: true } });

        // 2. Perform operations in transaction
        await prisma.$transaction(async (tx) => {
            for (const project of allProjects) {
                const isEnabled = projectIds.includes(project.id);

                if (isEnabled) {
                    // AUTO-CREATE CATEGORY CHECK
                    const existingCat = await tx.serviceCategory.findFirst({
                        where: {
                            projectId: project.id,
                            platform: service.platform,
                            categoryType: service.category
                        }
                    });

                    if (!existingCat) {
                        await SmartAnalyzerService.resolveCategory(tx, service.platform, service.category, service.targetType, project.id);
                    }
                }

                await tx.projectServiceOverride.upsert({
                    where: {
                        projectId_internalServiceId: {
                            projectId: project.id,
                            internalServiceId: serviceId
                        }
                    },
                    update: { isActive: isEnabled },
                    create: {
                        projectId: project.id,
                        internalServiceId: serviceId,
                        isActive: isEnabled
                    }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to update service availability:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
