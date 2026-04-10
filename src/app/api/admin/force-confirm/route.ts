/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/services/orders/order-processor.service';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('id');
    const secret = searchParams.get('secret');

    const session = await getAdminSession();
    if (!session || secret !== 'super-secret-123') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!paymentId) {
        return NextResponse.json({ error: 'No id provided' }, { status: 400 });
    }

    try {
        console.log(`[ForceConfirm] Attempting to confirm payment: ${paymentId}`);
        const result = await confirmPayment(paymentId);

        const tx = await prisma.transaction.findUnique({
            where: { externalId: paymentId },
            include: { user: true }
        });

        const latestOrder = tx ? await prisma.order.findFirst({
            where: { userId: tx.userId },
            orderBy: { createdAt: 'desc' },
            include: { internalService: true }
        }) : null;

        return NextResponse.json({
            success: result,
            transactionStatus: tx?.status,
            orderCreated: !!latestOrder && latestOrder.createdAt > new Date(Date.now() - 60000),
            latestOrder: latestOrder ? {
                id: latestOrder.id,
                service: latestOrder.internalService.name,
                status: latestOrder.status
            } : null
        });
    } catch (error: any) {
        console.error('[ForceConfirm Error]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


