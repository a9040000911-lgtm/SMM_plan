/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";

import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/orders/[id]
 * Get order details for current user
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                internalService: {
                    select: {
                        name: true,
                        platform: true,
                        category: true
                    }
                }
            }
        });

        if (!order || order.userId !== userId) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Flatten response for frontend
        return NextResponse.json({
            ...order,
            serviceName: order.internalService.name,
            platform: order.internalService.platform,
            category: order.internalService.category
        });
    } catch (error) {
        console.error('[API] Get client order error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
