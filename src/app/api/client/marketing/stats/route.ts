/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [userCount, serviceCount, orderCount] = await Promise.all([
            prisma.user.count(),
            prisma.internalService.count({ where: { isActive: true } }),
            prisma.order.count()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                users: userCount,
                services: serviceCount,
                orders: orderCount,
                launchDate: '2026-04-01',
                platforms: 6,
                earlyBirdLimit: 300
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
