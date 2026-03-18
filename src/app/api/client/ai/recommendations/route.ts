/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";

import { LoyaltyAIService } from '@/services/ai/loyalty-ai.service';

/**
 * GET /api/client/ai/recommendations
 * Get AI-driven loyalty insights and recommendations for the current user
 * Phase 10C: AI & Analytics
 */
export async function GET(_req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const analysis = await LoyaltyAIService.getUserAnalysis(session.user.id);

        return NextResponse.json(analysis);

    } catch (error) {
        console.error('[AI Recommendations API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


