/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';

export async function GET(_req: NextRequest) {
    try {
        const projectId = await getClientProjectId();
        if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const documents = await (prisma as any).legalDocument.findMany({
            where: { projectId, isActive: true },
            select: { slug: true, title: true }
        });

        return NextResponse.json(documents);
    } catch (_error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
