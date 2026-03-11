/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";

import { prisma } from '@/lib/prisma';
import { ProjectService, ProjectFeature } from '@/services/core/project.service';
import { getClientProjectId } from '@/utils/project-resolver';

// POST /api/client/reviews - создать отзыв
export async function POST(_req: NextRequest) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id || null;

        const projectId = await getClientProjectId();
        if (!projectId) {
            return NextResponse.json({ error: 'Project not found' }, { status: 400 });
        }

        // --- FEATURE FLAG CHECK ---
        const isEnabled = await ProjectService.isFeatureEnabled(projectId, ProjectFeature.REVIEWS);
        if (!isEnabled) {
            return NextResponse.json({ error: 'Reviews are disabled for this project' }, { status: 403 });
        }

        const body = await _req.json();
        const { rating, text, isAnonymous, orderId } = body;

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
        }

        const review = await (prisma as any).review.create({
            data: {
                userId,
                projectId,
                rating,
                text: text || null,
                isAnonymous: isAnonymous || false,
                orderId: orderId || null
            }
        });

        return NextResponse.json({ success: true, id: review.id });
    } catch (error) {
        console.error('[Review POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/client/reviews - получить свои отзывы
export async function GET(_req: NextRequest) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const reviews = await (prisma as any).review.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                rating: true,
                text: true,
                isAnonymous: true,
                status: true,
                createdAt: true,
                order: {
                    select: {
                        id: true,
                        internalService: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json({ reviews });
    } catch (error) {
        console.error('[Review GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
