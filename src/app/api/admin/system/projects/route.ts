/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
    try {
        const { getAdminSession } = await import('@/utils/admin-session');
        const session = await getAdminSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const where: any = {};
        if (!session.isGlobalAdmin) {
            where.id = { in: session.allowedProjects || [] };
        }

        const projects = await prisma.project.findMany({
            where,
            select: {
                id: true,
                name: true,
                domain: true
            },
            orderBy: { createdAt: 'asc' }
        });
        return NextResponse.json(projects);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
