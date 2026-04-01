/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RobokassaService } from '@/services/payments/robokassa.service';

/**
 * Robokassa Result URL Webhook
 * Called after successful payment
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const outSum = formData.get('OutSum') as string;
        const invId = formData.get('InvId') as string;
        const signatureValue = formData.get('SignatureValue') as string;
        const shpTxId = formData.get('Shp_txId') as string; // UUID of Transaction

        console.log(`[Robokassa Webhook] Received result for ${shpTxId || invId}, OutSum: ${outSum}`);

        if (!outSum || !invId || !signatureValue) {
            console.error('[Robokassa Webhook] Missing required parameters');
            return new NextResponse('ERR: Missing parameters', { status: 400 });
        }

        // Найти транзакцию по Shp_txId (или fallback на invId, если старый заказ)
        const targetId = shpTxId || invId;
        const transaction = await prisma.transaction.findUnique({
            where: { id: targetId },
            include: {
                user: {
                    include: {
                        project: {
                            select: {
                                paymentSettings: true
                            }
                        }
                    }
                }
            }
        });

        if (!transaction) {
            console.error(`[Robokassa Webhook] Transaction not found: ${targetId}`);
            return new NextResponse('ERR: Transaction not found', { status: 404 });
        }

        // Получить Password2 для проверки подписи
        const paymentSettings = transaction.user.project?.paymentSettings as any;
        const robokassaSettings = paymentSettings?.robokassa;

        if (!robokassaSettings?.password2) {
            console.error('[Robokassa Webhook] Password2 not configured');
            return new NextResponse('ERR: Configuration error', { status: 500 });
        }

        const mode = robokassaSettings.mode || paymentSettings?.mode || 'PRODUCTION';
        const password2 = mode === 'TEST' && robokassaSettings.testPassword2
            ? robokassaSettings.testPassword2
            : robokassaSettings.password2;

        // Проверить подпись
        const isValid = RobokassaService.verifySignature(outSum, invId, signatureValue, password2, shpTxId);

        if (!isValid) {
            console.error('[Robokassa Webhook] Invalid signature');
            return new NextResponse('ERR: Invalid signature', { status: 400 });
        }

        // Используем транзакцию Prisma для предотвращения Race-Conditions
        // Если Робокасса пришлет 2 хука одновременно, только один успеет зачислить бонус
        await prisma.$transaction(async (tx) => {
            const currentTx = await tx.transaction.findUnique({
                where: { id: targetId }
            });

            if (!currentTx || currentTx.status === 'COMPLETED') {
                console.log(`[Robokassa Webhook] Tx ${targetId} already processed or missing in tx block.`);
                return;
            }

            // Атомарный захват PENDING транзакции (Race Condition Prevention)
            const captureResult = await tx.transaction.updateMany({
                where: { id: targetId, status: 'PENDING' },
                data: {
                    status: 'COMPLETED',
                    metadata: {
                        ...(currentTx.metadata as object || {}),
                        robokassaOutSum: outSum,
                        completedAt: new Date().toISOString()
                    }
                }
            });

            if (captureResult.count === 0) {
                console.warn(`[Robokassa Webhook] Tx ${targetId} already processed (updateMany blocked Double-Credit).`);
                return;
            }

            // Начислить баланс пользователю
            const user = await tx.user.update({
                where: { id: currentTx.userId },
                data: {
                    balance: {
                        increment: currentTx.amount
                    }
                },
                select: { balance: true }
            });

            // Создать запись в Ledger
            await tx.ledgerEntry.create({
                data: {
                    projectId: currentTx.projectId,
                    userId: currentTx.userId,
                    amount: currentTx.amount,
                    currency: currentTx.currency,
                    balanceBefore: user.balance.toNumber() - currentTx.amount.toNumber(),
                    balanceAfter: user.balance.toNumber(),
                    type: 'DEPOSIT',
                    referenceId: currentTx.id,
                    description: `Robokassa payment #${invId}`
                }
            });

            console.log(`[Robokassa Webhook] Payment processed successfully for ${targetId}`);
        });

        // Robokassa требует ответ "OK" + InvId
        return new NextResponse(`OK${invId}`, { status: 200 });

    } catch (error: any) {
        console.error('[Robokassa Webhook Error]:', error);
        return new NextResponse('ERR: Internal error', { status: 500 });
    }
}

/**
 * GET handler for Success URL redirect
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const invId = searchParams.get('InvId');

    // Redirect to success page
    return NextResponse.redirect(new URL(`/payment/success?txId=${invId}`, req.url));
}


