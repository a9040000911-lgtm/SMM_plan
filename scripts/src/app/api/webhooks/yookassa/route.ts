/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/services/orders/order-processor.service';

/**
 * Webhook handler for YooKassa (and potentially other providers)
 * Needs to be added to YooKassa Dashboard: https://your-domain.com/api/webhooks/yookassa
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const event = body.event;
        const object = body.object;

        if (!event || !object) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // We only care about success
        if (event === 'payment.succeeded') {
            const paymentId = object.id;
            console.log(`[Webhook] Payment Succeeded event received: ${paymentId}`);

            const isSimulation = req.headers.get('x-debug-simulator') === 'true' && process.env.NODE_ENV === 'development';

            if (isSimulation) {
                console.log(`[Webhook] Simulation mode detected. Bypassing API verification for ${paymentId}`);
                await confirmPayment(paymentId);
                return NextResponse.json({ status: 'ok', simulated: true });
            }

            // SECURITY HARDENING: Re-verify status directly from YooKassa API
            const { PaymentService } = await import('@/services/finance/payment.service');
            const verification = await PaymentService.getPaymentStatus(paymentId);

            if (verification.success && verification.status === 'succeeded') {
                console.log(`[Webhook] Status verified via API: ${paymentId}`);
                const result = await confirmPayment(paymentId);
                if (result) {
                    console.log(`[Webhook] Order confirmed for payment: ${paymentId}`);
                } else {
                    console.warn(`[Webhook] Could not confirm order (duplicates?): ${paymentId}`);
                }
            } else {
                console.error(`[Webhook] SECURITY ALERT: Status verification failed for ${paymentId}. Event was succeeded but API says ${verification.status}`);
            }
        }

        if (event === 'payment.canceled') {
            console.log(`[Webhook] Payment Canceled: ${object.id}`);
            // Logic to mark tx as CANCELED if needed
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('[Webhook Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
