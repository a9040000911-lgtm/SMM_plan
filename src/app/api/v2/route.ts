/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MassOrderService } from '@/services/orders/mass-order.service';
import { checkRateLimit } from '@/services/core/rate-limiter';
import { PricingService } from '@/services/finance/pricing.service';

/**
 * Standard SMM API v2 (Compatible with Perfect Panel style)
 * POST /api/v2
 */
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const action = formData.get('action')?.toString();
        const apiKey = formData.get('key')?.toString();

        if (!apiKey) {
            return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
        }

        // 1. Authenticate user
        const user = await prisma.user.findUnique({
            where: { apiKey }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }

        // [SECURITY] Rate limit per user (60 req/min)
        const rateLimit = await checkRateLimit('api', `v2:${user.id}`);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const projectId = user.projectId; // Scoping to user's assigned project if any
        const isB2B = user.role === 'RESELLER' || user.isGlobalAdmin;

        // 2. Route actions
        switch (action) {
            case 'balance':
                return NextResponse.json({
                    balance: user.balance.toNumber(),
                    currency: user.currency
                });

            case 'services': {
                const services = await prisma.internalService.findMany({
                    where: {
                        isActive: true,
                        isPrivate: false,
                        ...(projectId ? {
                            providerMappings: {
                                some: { projectId, isActive: true }
                            }
                        } : {})
                    },
                    select: {
                        numericId: true,
                        name: true,
                        serviceCategory: { select: { categoryType: true, name: true } },
                        socialPlatform: { select: { slug: true, name: true } },
                        pricePer1000: true,
                        lastProviderPrice: true,
                        minQty: true,
                        maxQty: true,
                        description: true,
                        type: true
                    }
                });

                return NextResponse.json(services.map(s => {
                    let rate = s.pricePer1000.toNumber();
                    if (isB2B) {
                        const cost = s.lastProviderPrice || s.pricePer1000.div(6);
                        rate = PricingService.calculateB2BPrice(cost).toNumber();
                    }

                    return {
                        service: s.numericId,
                        name: s.name,
                        type: s.type || 'Default',
                        category: s.serviceCategory?.name || s.serviceCategory?.categoryType || 'Other',
                        rate: rate,
                        min: s.minQty,
                        max: s.maxQty,
                        dripfeed: true,
                        description: s.description || ''
                    };
                }));
            }

            case 'add': {
                // [SECURITY] Validate with Zod schema
                const { v2AddOrderSchema, safeParse } = await import('@/lib/schemas/api');
                const v2Parsed = safeParse(v2AddOrderSchema, {
                    service: formData.get('service')?.toString(),
                    link: formData.get('link')?.toString(),
                    quantity: Number(formData.get('quantity')),
                });
                if (!v2Parsed.success) {
                    return NextResponse.json({ error: v2Parsed.error }, { status: 400 });
                }
                const { service: serviceNumericId, link, quantity } = v2Parsed.data!;

                // Resolve numericId → internal UUID
                const serviceRecord = await prisma.internalService.findFirst({
                    where: {
                        OR: [
                            { numericId: parseInt(serviceNumericId) || -1 },
                            { id: serviceNumericId }
                        ],
                        isActive: true
                    },
                    select: { id: true, minQty: true, maxQty: true }
                });

                if (!serviceRecord) {
                    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
                }

                // [SECURITY] Validate quantity against service limits
                if (quantity < (serviceRecord.minQty || 1) || quantity > (serviceRecord.maxQty || 1000000)) {
                    return NextResponse.json({ 
                        error: `Quantity must be between ${serviceRecord.minQty || 1} and ${serviceRecord.maxQty || 1000000}` 
                    }, { status: 400 });
                }

                try {
                    const result = await MassOrderService.processMassOrder(user.id, projectId, [{
                        serviceId: serviceRecord.id,
                        link,
                        quantity
                    }], { isB2B });

                    return NextResponse.json({
                        order: result.batchId
                    });
                } catch (err: any) {
                    // [SECURITY] Never expose internal error details to API consumers
                    console.error('[API_V2] Order error:', err.message);
                    return NextResponse.json({ error: 'Order processing failed' }, { status: 400 });
                }
            }

            case 'status': {
                const orderId = formData.get('order')?.toString() || formData.get('orders')?.toString();
                if (!orderId) {
                    return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
                }

                // If multiple orders separated by comma, return a map
                const orderIds = orderId.split(',').map(id => id.trim()).filter(Boolean);

                const batchOrders = await prisma.batchOrder.findMany({
                    where: { id: { in: orderIds }, userId: user.id },
                    include: {
                        orders: {
                            select: {
                                id: true,
                                status: true,
                                remains: true,
                                quantity: true,
                                totalPrice: true,
                            }
                        }
                    }
                });

                const statusMap: Record<string, string> = {
                    'PENDING': 'Pending',
                    'PROCESSING': 'Processing',
                    'IN_PROGRESS': 'In progress',
                    'COMPLETED': 'Completed',
                    'PARTIAL': 'Partial',
                    'CANCELED': 'Canceled',
                    'AWAITING_PAYMENT': 'Pending',
                    'MANUAL_REVIEW': 'Processing'
                };

                const responseObj: Record<string, any> = {};

                for (const batch of batchOrders) {
                    if (batch.orders.length > 0) {
                        const realOrder = batch.orders[0];
                        responseObj[batch.id] = {
                            charge: realOrder.totalPrice.toNumber(),
                            start_count: realOrder.quantity - realOrder.remains,
                            status: statusMap[realOrder.status] || realOrder.status,
                            remains: realOrder.remains,
                            currency: user.currency
                        };
                    } else {
                        responseObj[batch.id] = { error: 'Incorrect order ID' };
                    }
                }

                if (orderIds.length === 1) {
                    return NextResponse.json(responseObj[orderIds[0]] || { error: 'Incorrect order ID' });
                }

                return NextResponse.json(responseObj);
            }

            case 'cancel': {
                const orderIdsRaw = formData.get('orders')?.toString();
                if (!orderIdsRaw) return NextResponse.json({ error: 'Missing orders' }, { status: 400 });

                const orderIds = orderIdsRaw.split(',').map(id => id.trim()).filter(Boolean);
                const responseObj: Record<string, string> = {};

                const { ProviderService } = await import('@/services/providers/provider.service');

                const batchOrders = await prisma.batchOrder.findMany({
                    where: { id: { in: orderIds }, userId: user.id },
                    include: { orders: true }
                });

                for (const batch of batchOrders) {
                    if (batch.orders.length === 0) {
                        responseObj[batch.id] = 'Incorrect request';
                        continue;
                    }

                    const realOrder = batch.orders[0];
                    if (['COMPLETED', 'CANCELED', 'PARTIAL'].includes(realOrder.status)) {
                        responseObj[batch.id] = 'Order already completed or canceled';
                        continue;
                    }

                    const res = await ProviderService.cancelOrder(realOrder);
                    if (res.success) {
                        await prisma.order.update({
                            where: { id: realOrder.id },
                            data: { 
                                status: 'CANCELED',
                                metadata: { ...(realOrder.metadata as any || {}), internalCancelReq: true }
                            }
                        });
                        responseObj[batch.id] = 'Cancel requests are submitted';
                    } else {
                        // Request manual review by support
                        await prisma.supportTicket.create({
                            data: {
                                userId: user.id,
                                subject: `Manual cancel request #` + batch.id,
                                status: 'OPEN',
                                messages: {
                                    create: {
                                        sender: 'USER',
                                        text: `System auto-generated message: User requested cancellation via V2 API. Provider returned error: ${res.error}. Please review manually.`
                                    }
                                }
                            }
                        });
                        responseObj[batch.id] = 'Cancellation requires support, ticket created';
                    }
                }

                return NextResponse.json(responseObj);
            }

            case 'refill': {
                const orderIdsRaw = formData.get('orders')?.toString();
                if (!orderIdsRaw) return NextResponse.json({ error: 'Missing orders' }, { status: 400 });

                const orderIds = orderIdsRaw.split(',').map(id => id.trim()).filter(Boolean);
                const responseObj: Record<string, string> = {};

                const { ProviderService } = await import('@/services/providers/provider.service');

                const batchOrders = await prisma.batchOrder.findMany({
                    where: { id: { in: orderIds }, userId: user.id },
                    include: { orders: true }
                });

                for (const batch of batchOrders) {
                    if (batch.orders.length === 0) {
                        responseObj[batch.id] = 'Incorrect request';
                        continue;
                    }

                    const realOrder = batch.orders[0];
                    const res = await ProviderService.refillOrder(realOrder.id);
                    if (res.success) {
                        responseObj[batch.id] = 'Refill requests are submitted';
                    } else {
                        responseObj[batch.id] = 'Incorrect request';
                    }
                }

                return NextResponse.json(responseObj);
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[API_V2_ERROR]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


