/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";

import { ReferralLeaderboardService } from '@/services/users/referral-leaderboard.service';

/**
 * GET /api/client/referrals/leaderboard
 * Get monthly referral leaderboard + user stats
 * Phase 10B: Tiered Referrals
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const monthParam = searchParams.get('month'); // Format: YYYY-MM

        // Parse month or default to current month
        let month: Date;
        if (monthParam) {
            const [year, monthNum] = monthParam.split('-').map(Number);
            month = new Date(year, monthNum - 1, 1);
        } else {
            const now = new Date();
            month = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Get user's project for filtering
        const { prisma } = await import('@/lib/prisma');
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { projectId: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get leaderboard (top 10)
        const leaderboard = await ReferralLeaderboardService.getLeaderboard(
            month,
            user.projectId,
            10
        );

        // Get user's rank for this month
        const userRank = await ReferralLeaderboardService.getUserRank(
            session.user.id,
            month
        );

        // Get user's all-time stats
        const userStats = await ReferralLeaderboardService.getUserStats(session.user.id);

        return NextResponse.json({
            month: month.toISOString().split('T')[0],
            leaderboard,
            userRank,
            userStats
        });

    } catch (error) {
        console.error('[Referrals Leaderboard API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
