/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from "@/auth";

import { AchievementService } from '@/services/gamification/achievement.service';

/**
 * GET /api/client/achievements
 * Get user's achievements
 */
export async function GET() {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const achievements = await AchievementService.getUserAchievements(userId);

        return NextResponse.json({ achievements });
    } catch (error) {
        console.error('[API] Get achievements error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}


