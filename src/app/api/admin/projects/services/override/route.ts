/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/utils/admin-session';
import { sanitizeData } from '@/utils/service-sanitizer';

export async function POST(req: Request) {
    try {
        const session = await getAdminSession();
        if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { serviceId, projectId, isActive, customPrice } = await req.json();

        // Security check: ensure admin has access to this project
        if (!session.isGlobalAdmin && !session.allowedProjects.includes(projectId)) {
            return NextResponse.json({ error: 'Unauthorized - No access to this project' }, { status: 403 });
        }

        const override = await prisma.projectServiceOverride.upsert({
            where: {
                projectId_internalServiceId: {
                    projectId,
                    internalServiceId: serviceId
                }
            },
            update: {
                isActive,
                ...(customPrice !== undefined && { customPrice })
            },
            create: {
                projectId,
                internalServiceId: serviceId,
                isActive,
                ...(customPrice !== undefined && { customPrice })
            }
        });

        return NextResponse.json(sanitizeData(override));
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


