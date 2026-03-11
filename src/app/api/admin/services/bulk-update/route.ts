/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

export const dynamic = 'force-dynamic';

/**
 * Массовое обновление цен услуг
 * Принимает список объектов { id, pricePer1000 }
 */
export async function POST(req: NextRequest) {
    try {
        const { updates } = await req.json();

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
        }

        const results = await prisma.$transaction(
            updates.map(update =>
                prisma.internalService.update({
                    where: { id: update.id },
                    data: {
                        pricePer1000: new Decimal(update.pricePer1000)
                    }
                })
            )
        );

        return NextResponse.json({
            success: true,
            count: results.length
        });
    } catch (error: any) {
        console.error('Bulk price update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
