/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const documents = await (prisma as any).legalDocument.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, slug, title, content, isActive } = body;

        if (!projectId || !slug || !title || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const document = await (prisma as any).legalDocument.create({
            data: {
                projectId,
                slug,
                title,
                content,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json(document);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Slug must be unique for this project' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, content, isActive, slug } = body;

        if (!id) {
            return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
        }

        const document = await (prisma as any).legalDocument.update({
            where: { id },
            data: {
                title,
                content,
                isActive,
                slug
            }
        });

        return NextResponse.json(document);
    } catch (_error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    await (prisma as any).legalDocument.delete({
        where: { id }
    });

    return NextResponse.json({ success: true });
}
