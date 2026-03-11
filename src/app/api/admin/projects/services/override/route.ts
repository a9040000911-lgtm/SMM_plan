/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { serviceId, projectId, isActive, customPrice } = await req.json();

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

        return NextResponse.json(override);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
