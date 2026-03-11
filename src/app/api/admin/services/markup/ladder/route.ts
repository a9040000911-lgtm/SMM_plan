/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PricingService } from '@/services/finance/pricing.service';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');

        const ladder = await PricingService.getPricingLadder(projectId);
        return NextResponse.json(ladder);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ladder, projectId } = body;

        if (!Array.isArray(ladder)) {
            return NextResponse.json({ error: 'Ladder must be an array' }, { status: 400 });
        }

        await PricingService.updatePricingLadder(ladder, projectId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Ladder API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
