/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const projectId = await getClientProjectId();
        if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const document = await (prisma as any).legalDocument.findUnique({
            where: {
                projectId_slug: { projectId, slug }
            }
        });

        if (!document || !document.isActive) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json(document);
    } catch (_error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
