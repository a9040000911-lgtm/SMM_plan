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
                    select: { name: true, isCancelEnabled: true, isRefillEnabled: true, socialPlatform: { select: { slug: true } }, serviceCategory: { select: { categoryType: true } } }
                }
            }
        });

        if (!order || order.userId !== userId) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Flatten response for frontend
        return NextResponse.json({
            ...order,
            serviceName: order.internalService?.name,
            platform: order.internalService?.socialPlatform?.slug,
            category: order.internalService?.serviceCategory?.categoryType,
            isCancelEnabled: order.internalService?.isCancelEnabled || false,
            isRefillEnabled: order.internalService?.isRefillEnabled || false
        });
    } catch (error) {
        console.error('[API] Get client order error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PATCH(
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
            where: { id: orderId }
        });

        if (!order || order.userId !== userId) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const body = await request.json();

        if (body.action === 'CANCEL') {
            if (['PENDING', 'AWAITING_PAYMENT', 'ERROR'].includes(order.status)) {
                const { processManualRefund } = await import('@/services/orders');
                
                await processManualRefund(order.id, 'INTERNAL', false, userId);
                
                return NextResponse.json({ success: true, message: 'Заказ успешно отменен, средства возвращены.' });
            } 
            else if (['PROCESSING', 'IN_PROGRESS'].includes(order.status) || order.isDripFeed) {
                // ПАТТЕРН: Сначала изменяем БД, затем внешний вызов (Compensating transaction)
                const meta = (order.metadata as Record<string, any>) || {};
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'CANCELED',
                        metadata: { ...meta, internalCancelReq: true }
                    }
                });

                const { ProviderService } = await import('@/services/providers/provider.service');
                const cancelRes = await ProviderService.cancelOrder(order);

                if (cancelRes.success) {
                    return NextResponse.json({ success: true, message: 'Запрос на отмену отправлен провайдеру (API). Средства вернутся после подтверждения.' });
                } else {
                    // ОТКАТ (Rollback) если провайдер ответил ошибкой
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { 
                            status: order.status, // Возврат старого статуса (PROCESSING/IN_PROGRESS)
                            metadata: { ...meta, cancelRequested: true } 
                        }
                    });

                    const { UnifiedNotificationService } = await import('@/services/core/notification.service');
                    await UnifiedNotificationService.notifyAdmin(
                        order.projectId || 'N/A', 
                        `⚠️ <b>Запрос на отмену от клиента</b>\nЗаказ: #${order.id}\nПользователь ID: ${userId}\nПровайдер API недоступен/ошибка: ${cancelRes.error || 'N/A'}`
                    ).catch(e => console.error(e));

                    return NextResponse.json({ 
                        success: false, 
                        message: 'API отмена не поддерживается провайдером. Запрос отправлен администратору.' 
                    });
                }
            } else {
                return NextResponse.json({ error: `Невозможно отменить заказ со статусом ${order.status}` }, { status: 400 });
            }
        } else if (body.action === 'REFILL') {
            if (['COMPLETED', 'PARTIAL', 'IN_PROGRESS'].includes(order.status) && !order.isDripFeed) {
                const { ProviderService } = await import('@/services/providers/provider.service');
                const refillRes = await ProviderService.refillOrder(order.id);

                if (refillRes.success) {
                    return NextResponse.json({ success: true, message: 'Запрос на восстановление (докрутку) отправлен провайдеру.' });
                } else {
                    // Create manual support ticket since API refill failed/unsupported
                    await prisma.supportTicket.create({
                        data: {
                            userId: userId,
                            subject: `Запрос на докрутку (Refill) заказа #${order.id}`,
                            status: 'OPEN',
                            messages: {
                                create: {
                                    sender: 'USER',
                                    text: `Системное сообщение: Клиент запросил докрутку. API провайдера вернул ошибку: ${refillRes.error}. Пожалуйста, запустите вручную.`
                                }
                            }
                        }
                    });

                    return NextResponse.json({ 
                        success: false, 
                        message: 'API докрутка не поддерживается провайдером. Создан тикет в поддержку.' 
                    });
                }
            } else {
                return NextResponse.json({ error: `Невозможно запросить докрутку для заказа со статусом ${order.status}` }, { status: 400 });
            }
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    } catch (error: any) {
        console.error('[API Client Order Action Error]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
