/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";

import { prisma } from '@/lib/prisma';

// Import challenge config for rewards
const CHALLENGE_REWARDS: Record<string, number> = {
    TRIPLE_THREAT: 100,
    SOCIAL_SHARE: 200,
    EARLY_BIRD: 50,
    WEEKEND_WARRIOR: 150,
    SPENDING_SPREE: 500
};

/**
 * GET /api/client/challenges
 * Get active challenges with progress for user
 * Phase 10B Week 3
 */
export async function GET(_req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const challenges = await prisma.challenge.findMany({
            where: {
                userId: session.user.id,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            challenges: challenges.map((c: any) => ({
                id: c.id,
                type: c.type,
                target: c.target,
                progress: c.progress,
                reward: CHALLENGE_REWARDS[c.type]?.toString() || '0',
                completed: c.completed,
                expiresAt: c.expiresAt,
                createdAt: c.createdAt
            }))
        });

    } catch (error) {
        console.error('[Challenges API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


