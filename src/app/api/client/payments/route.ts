/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";

import { getClientProjectId } from '@/utils/project-resolver';
import { UnifiedPaymentService } from '@/services/payments/unified-payment.service';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount } = await req.json();
        const numAmount = parseFloat(amount);

        if (isNaN(numAmount) || numAmount < 10 || numAmount > 1000000) {
            return NextResponse.json({ error: 'Сумма пополнения должна быть от 10 до 1 000 000 ₽' }, { status: 400 });
        }

        const projectId = await getClientProjectId();
        if (!projectId) {
            return NextResponse.json({ error: 'Project context missing' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { email: session.user.email, projectId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const result = await UnifiedPaymentService.createPayment(
            projectId,
            user.id,
            numAmount,
            `Пополнение баланса (User: ${user.username})`,
            { source: 'WEB_V2' }
        );

        if (result.success && result.confirmationUrl) {
            return NextResponse.json({ success: true, url: result.confirmationUrl });
        } else {
            return NextResponse.json({ error: result.error || 'Failed to create payment' }, { status: 502 });
        }

    } catch (error: any) {
        console.error('[API Payments POST Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


