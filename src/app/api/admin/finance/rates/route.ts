/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { CurrencyService } from '@/services/finance/currency.service';
import { getAdminSession } from '@/utils/admin-session';

export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rates = await CurrencyService.getRates();
        return NextResponse.json(rates);
    } catch (error: any) {
        console.error('[API] Finance Rates Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


