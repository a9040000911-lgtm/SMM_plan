/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/utils/admin-session';
import { ChurnPredictionService } from '@/services/churn/churn-prediction.service';

/**
 * GET /api/admin/churn/at-risk
 * Get orders with high churn risk (REFILL_NOW)
 */
export async function GET() {
    try {
        const session = await getAdminSession();

        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const atRiskOrders = await ChurnPredictionService.getAtRiskOrders(50);

        return NextResponse.json({ orders: atRiskOrders });
    } catch (error) {
        console.error('[API] Get at-risk orders error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
