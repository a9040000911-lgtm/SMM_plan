/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";

import { AchievementService } from '@/services/gamification/achievement.service';

/**
 * POST /api/client/achievements/claim
 * Claim achievement reward
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { achievementId } = await request.json();
        if (!achievementId) {
            return NextResponse.json({ error: 'Achievement ID required' }, { status: 400 });
        }

        const result = await AchievementService.claimReward(achievementId);

        if (!result.success) {
            return NextResponse.json({ error: 'Failed to claim' }, { status: 400 });
        }

        return NextResponse.json({ success: true, reward: result.reward });
    } catch (error) {
        console.error('[API] Claim achievement error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}


