/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/services/orders/order-processor.service';
import ipRangeCheck from 'ip-range-check';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Official YooKassa IP subnets for webhooks
const YOOKASSA_IP_SUBNETS = [
    '185.71.76.0/27',
    '185.71.77.0/27',
    '77.75.153.0/25',
    '77.75.156.11',
    '77.75.156.35',
    '77.75.154.128/25',
    '2a02:5180::/32'
];

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

        const clientIpStr = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
        const clientIp = clientIpStr.split(',')[0].trim();
        const isSimulation = req.headers.get('x-debug-simulator') === 'true' && process.env.NODE_ENV === 'development';

        // SECURITY HARDENING 1: Validate IP Origin against YooKassa official subnets
        if (!isSimulation && !ipRangeCheck(clientIp, YOOKASSA_IP_SUBNETS)) {
            console.error(`[Webhook] SECURITY ALERT: Blocked unauthorized YooKassa webhook from IP: ${clientIpStr}`);
            return NextResponse.json({ error: 'Forbidden: IP not in whitelist' }, { status: 403 });
        }

        // We only care about success
        if (event === 'payment.succeeded') {
            const paymentId = object.id;
            console.log(`[Webhook] Payment Succeeded event received: ${paymentId}`);

            const isSimulation = req.headers.get('x-debug-simulator') === 'true' && process.env.NODE_ENV === 'development';

            if (isSimulation) {
                console.log(`[Webhook] Simulation mode detected. Bypassing API verification for ${paymentId}`);
                if (object.metadata?.type === 'B2B_TOPUP') {
                    const { OrganizationLedgerService } = await import('@/services/finance/organization-ledger.service');
                    await prisma.$transaction(async (tx) => {
                        await OrganizationLedgerService.recordTransaction(tx, {
                            organizationId: object.metadata.organization_id,
                            amount: Number(object.amount.value),
                            type: 'TOPUP',
                            description: `[B2B Topup] Simulation Payment ${paymentId}`,
                            referenceId: paymentId
                        });
                    });
                } else {
                    await confirmPayment(paymentId);
                }
                return NextResponse.json({ status: 'ok', simulated: true });
            }

            // SECURITY HARDENING: Re-verify status directly from YooKassa API
            const { PaymentService } = await import('@/services/finance/payment.service');
            
            // If B2B, force credentials to system config
            let verificationCredentials = undefined;
            if (object.metadata?.type === 'B2B_TOPUP') {
                const { ConfigService } = await import('@/services/core/config.service');
                const sysConfig = await ConfigService.getPaymentConfig();
                verificationCredentials = { shopId: sysConfig.shopId, secretKey: sysConfig.secretKey };
            }

            const verification = await PaymentService.getPaymentStatus(paymentId, verificationCredentials);

            if (verification.success && verification.status === 'succeeded') {
                console.log(`[Webhook] Status verified via API: ${paymentId}`);
                
                // SECURITY HARDENING: Trust ONLY verification.raw data to prevent Webhook Spoofing
                const verifiedMetadata = verification.raw?.metadata || {};
                const verifiedAmount = verification.raw?.amount?.value;

                if (verifiedMetadata.type === 'B2B_TOPUP') {
                    // It's a B2B Account Topup
                    const { OrganizationLedgerService } = await import('@/services/finance/organization-ledger.service');
                    
                    // Duplicate Topup Prevention using Database Locks
                    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                        // Атомарный ROW-LEVEL Lock на сущность Организации
                        await tx.organization.update({
                            where: { id: verifiedMetadata.organization_id },
                            data: { updatedAt: new Date() }
                        });

                        const existingTopup = await tx.organizationLedgerEntry.findFirst({
                            where: { referenceId: paymentId, type: 'TOPUP' }
                        });

                        if (existingTopup) {
                            console.warn(`[Webhook] Blocked concurrent/duplicate B2B Topup for payment: ${paymentId}`);
                            return;
                        }

                        await OrganizationLedgerService.recordTransaction(tx, {
                            organizationId: verifiedMetadata.organization_id,
                            amount: Number(verifiedAmount),
                            type: 'TOPUP',
                            description: `[B2B Topup] Payment ${paymentId}`,
                            referenceId: paymentId
                        });
                        console.log(`[Webhook] B2B Topup confirmed for organization: ${verifiedMetadata.organization_id}`);
                    });
                } else if (verifiedMetadata.type === 'SUBSCRIPTION_INIT' || verifiedMetadata.type === 'SUBSCRIPTION_RENEWAL') {
                    // It's a Subscription Payment (Priority Pass)
                    const { SubscriptionService } = await import('@/services/finance/subscription.service');
                    const paymentMethodId = verification.raw?.payment_method?.id;
                    
                    if (!paymentMethodId) {
                        console.error(`[Webhook] ERROR: No payment_method_id returned for subscription payment ${paymentId}`);
                    } else {
                        try {
                            await SubscriptionService.handleSuccessfulPayment(verifiedMetadata.user_id, paymentMethodId, paymentId);
                            console.log(`[Webhook] Subscription activated/renewed for user ${verifiedMetadata.user_id}`);
                        } catch (subErr) {
                            console.error(`[Webhook] Subscription Payment Error:`, subErr);
                        }
                    }
                } else {
                    // It's a standard Retail Payment — with idempotency check
                    const existingTx = await prisma.transaction.findFirst({
                        where: { externalId: paymentId, status: 'COMPLETED' }
                    });
                    if (existingTx) {
                        console.warn(`[Webhook] Blocked duplicate retail payment confirmation: ${paymentId}`);
                    } else {
                        const result = await confirmPayment(paymentId);
                        if (result) {
                            console.log(`[Webhook] Order confirmed for payment: ${paymentId}`);
                        } else {
                            console.warn(`[Webhook] Could not confirm order: ${paymentId}`);
                        }
                    }
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


