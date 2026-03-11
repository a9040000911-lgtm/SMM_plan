/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";

import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';

// POST /api/client/bug-reports - создать bug report
export async function POST(_req: NextRequest) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id || null;

        const projectId = await getClientProjectId();
        if (!projectId) {
            return NextResponse.json({ error: 'Project not found' }, { status: 400 });
        }

        const body = await _req.json();
        const { title, description, severity, stepsToReproduce, screenshotUrl } = body;

        if (!title || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const bugReport = await (prisma as any).bugReport.create({
            data: {
                userId,
                projectId,
                title,
                description,
                severity: severity || 'MINOR',
                stepsToReproduce,
                screenshotUrl
            }
        });

        return NextResponse.json({ success: true, id: bugReport.id });
    } catch (error) {
        console.error('[Bug Report POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(_req: NextRequest) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bugReports = await (prisma as any).bugReport.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                severity: true,
                status: true,
                rewardAmount: true,
                rewardPaid: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return NextResponse.json({ bugReports });
    } catch (error) {
        console.error('[Bug Report GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
