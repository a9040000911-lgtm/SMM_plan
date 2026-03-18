/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MassOrderService } from '@/services/orders/mass-order.service';

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

        const projectId = user.projectId; // Scoping to user's assigned project if any

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
                        ...(projectId ? {
                            providerMappings: {
                                some: { projectId, isActive: true }
                            }
                        } : {})
                    },
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        platform: true,
                        pricePer1000: true,
                        minQty: true,
                        maxQty: true,
                        description: true
                    }
                });

                return NextResponse.json(services.map(s => ({
                    service: s.id,
                    name: s.name,
                    type: s.category,
                    rate: s.pricePer1000.toNumber(),
                    min: s.minQty,
                    max: s.maxQty
                })));
            }

            case 'add': {
                const serviceId = formData.get('service')?.toString();
                const link = formData.get('link')?.toString();
                const quantity = Number(formData.get('quantity'));

                if (!serviceId || !link || !quantity) {
                    return NextResponse.json({ error: 'Missing parameters (service, link, quantity)' }, { status: 400 });
                }

                try {
                    // result.batchId is used, which is correct. 
                    // MassOrderService.processMassOrder will now handle flexible ID resolution.
                    const result = await MassOrderService.processMassOrder(user.id, projectId, [{
                        serviceId,
                        link,
                        quantity
                    }]);

                    return NextResponse.json({
                        order: result.batchId // Standard SMM panels expect 'order' as ID
                    });
                } catch (err: any) {
                    return NextResponse.json({ error: err.message }, { status: 400 });
                }
            }

            case 'status': {
                const orderId = formData.get('order')?.toString();
                if (!orderId) {
                    return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
                }

                // Check BatchOrder or single Order
                const batchOrder = await prisma.batchOrder.findFirst({
                    where: { id: orderId, userId: user.id }
                });

                if (!batchOrder) {
                    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
                }

                return NextResponse.json({
                    charge: batchOrder.totalAmount.toNumber(),
                    status: batchOrder.status, // e.g., COMPLETED, PROCESSING
                    currency: user.currency
                });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[API_V2_ERROR]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


