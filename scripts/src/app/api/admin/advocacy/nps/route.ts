/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/utils/admin-session';
import { AdvocacyService } from '@/services/advocacy/advocacy.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/advocacy/nps
 * Get NPS analytics and recent surveys
 * Phase 10B: Admin NPS Dashboard
 */
export async function GET(_req: NextRequest) {
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

        // Get NPS analytics
        const analytics = await AdvocacyService.getNPSAnalytics(user.projectId || undefined);

        // Get recent surveys with user details
        const recentSurveys = await prisma.nPSSurvey.findMany({
            where: user.projectId ? { projectId: user.projectId } : {},
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: {
                    select: {
                        username: true,
                        tgId: true
                    }
                },
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

        // NPS trend (last 30 days, grouped by week)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const surveysLast30Days = await prisma.nPSSurvey.findMany({
            where: {
                ...(user.projectId ? { projectId: user.projectId } : {}),
                createdAt: { gte: thirtyDaysAgo }
            },
            orderBy: { createdAt: 'asc' },
            select: {
                score: true,
                createdAt: true
            }
        });

        // Group by week
        const weeklyData: Record<string, { promoters: number; passives: number; detractors: number; total: number }> = {};

        surveysLast30Days.forEach((s: any) => {
            const weekStart = new Date(s.createdAt);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { promoters: 0, passives: 0, detractors: 0, total: 0 };
            }

            weeklyData[weekKey].total++;
            if (s.score >= 9) weeklyData[weekKey].promoters++;
            else if (s.score >= 7) weeklyData[weekKey].passives++;
            else weeklyData[weekKey].detractors++;
        });

        const trend = Object.entries(weeklyData).map(([week, data]: [string, any]) => ({
            week,
            score: Math.round(((data.promoters / data.total) - (data.detractors / data.total)) * 100),
            total: data.total
        }));

        return NextResponse.json({
            analytics,
            recentSurveys: recentSurveys.map((s: any) => ({
                id: s.id,
                score: s.score,
                comment: s.comment,
                username: s.user.username || `User ${s.user.tgId}`,
                serviceName: s.order?.internalService.name || 'N/A',
                createdAt: s.createdAt
            })),
            trend
        });

    } catch (error) {
        console.error('[Admin NPS API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
