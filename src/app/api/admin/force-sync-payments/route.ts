/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentService } from '@/services/finance/payment.service';
import { confirmPayment } from '@/services/orders/order-processor.service';

import { getAdminSession } from '@/utils/admin-session';

/**
 * GET /api/admin/force-sync-payments
 * 
 * Ручная синхронизация статусов платежей YooKassa.
 * Проверяет все PENDING транзакции через API YooKassa и подтверждает оплаченные.
 */
export async function GET(_req: NextRequest) {
    try {
        const session = await getAdminSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const pending = await prisma.transaction.findMany({
            where: {
                status: 'PENDING',
                provider: 'YOOKASSA',
                externalId: { not: null }
            },
            select: { id: true, externalId: true, amount: true, createdAt: true }
        });

        if (pending.length === 0) {
            return NextResponse.json({ message: 'No pending YooKassa transactions found', count: 0 });
        }

        const results: any[] = [];

        for (const tx of pending) {
            try {
                const data = await PaymentService.getPaymentStatus(tx.externalId!);

                if (data.success && data.status === 'succeeded') {
                    // Use the existing confirmPayment flow
                    const confirmed = await confirmPayment(tx.externalId!);
                    results.push({
                        txId: tx.id,
                        paymentId: tx.externalId,
                        status: 'CONFIRMED',
                        confirmed
                    });
                } else if (data.status === 'canceled') {
                    await prisma.transaction.update({
                        where: { id: tx.id },
                        data: { status: 'ERROR' }
                    });
                    results.push({
                        txId: tx.id,
                        paymentId: tx.externalId,
                        status: 'CANCELED'
                    });
                } else {
                    results.push({
                        txId: tx.id,
                        paymentId: tx.externalId,
                        status: data.status || 'UNKNOWN'
                    });
                }
            } catch (err: any) {
                results.push({
                    txId: tx.id,
                    paymentId: tx.externalId,
                    status: 'ERROR',
                    error: 'Sync failed'
                });
            }
        }

        return NextResponse.json({
            message: `Processed ${pending.length} transactions`,
            results
        });
    } catch (error: any) {
        console.error('[Force Sync Payments Error]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


