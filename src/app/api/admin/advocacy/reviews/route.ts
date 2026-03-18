/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/utils/admin-session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/advocacy/reviews
 * Get reviews pending moderation
 * Phase 10B: Review Moderation
 */
export async function GET(req: NextRequest) {
    try {
        const adminSession = await getAdminSession();

        if (!adminSession?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: adminSession.id }
        });

        if (!user || !['ADMIN', 'SEO'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'PENDING';

        const reviews = await prisma.review.findMany({
            where: {
                ...(user.projectId ? { projectId: user.projectId } : {}),
                status: status as any
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: {
                    select: {
                        username: true,
                        tgId: true
                    }
                },
                order: {
                    select: {
                        internalService: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            reviews: reviews.map((r: any) => ({
                id: r.id,
                rating: r.rating,
                text: r.text,
                username: r.user.username || `User ${r.user.tgId}`,
                serviceName: r.order?.internalService.name || 'General',
                status: r.status,
                qualityScore: r.qualityScore,
                rewardClaimed: r.rewardClaimed,
                rewardAmount: r.rewardAmount?.toString(),
                createdAt: r.createdAt
            }))
        });

    } catch (error) {
        console.error('[Admin Reviews API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/advocacy/reviews
 * Moderate review (approve/reject + assign quality score)
 */
export async function PATCH(req: NextRequest) {
    try {
        const adminSession = await getAdminSession();

        if (!adminSession?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: adminSession.id }
        });

        if (!user || !['ADMIN', 'SEO'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { reviewId, action, qualityScore } = body;

        if (!reviewId || !action) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Update review status
        await prisma.review.update({
            where: { id: reviewId },
            data: {
                status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                moderatedBy: adminSession.id,
                moderatedAt: new Date()
            }
        });

        // If approved and quality score assigned, reward user
        if (action === 'approve' && qualityScore && ['LOW', 'MEDIUM', 'HIGH'].includes(qualityScore)) {
            const { AdvocacyService } = await import('@/services/advocacy/advocacy.service');
            await AdvocacyService.rewardReview(reviewId, qualityScore as any);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Admin Reviews PATCH] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


