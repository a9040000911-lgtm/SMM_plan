/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextResponse } from 'next/server';
import { MassOrderService } from '@/services/orders/mass-order.service';

/**
 * Public API for B2B Clients (Resellers)
 * POST /api/v1/orders
 * 
 * Headers:
 * Authorization: Bearer <API_KEY> (For V1, uses userId as the API key to avoid DB migrations)
 * 
 * Body:
 * {
 *   "serviceId": "123", // or number
 *   "link": "https://t.me/example",
 *   "quantity": 1000
 * }
 */
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        // In a real production scenario with DB migrations, we would lookup `apiKey: token`
        // For V1 MVP, we simulate API key by expecting the actual userId or a known static token mapping.
        // Assuming the token IS the userId for now (or validate via another service)
        const userId = token;

        // Basic validation: userId should look like an ObjectId length (24 chars) or UUID
        if (!userId || userId.length < 10) {
            return NextResponse.json({ error: 'Unauthorized: Invalid API Key format' }, { status: 401 });
        }

        const body = await req.json();

        // Validate required fields
        if (!body.serviceId || !body.link || !body.quantity) {
            return NextResponse.json({
                error: 'Bad Request: Missing required fields (serviceId, link, quantity)'
            }, { status: 400 });
        }

        const quantity = Number(body.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            return NextResponse.json({ error: 'Bad Request: Invalid quantity' }, { status: 400 });
        }

        // Format as mass order entry to reuse our robust validation & execution logic
        const entries = [{
            serviceId: String(body.serviceId),
            link: String(body.link),
            quantity: quantity
        }];

        // We use null for projectId in public API to use the default root project context
        // Alternatively, if the API key belongs to a specific project, we would resolve it here
        const projectId = null;

        // 1. Validate the order first
        const validation = await MassOrderService.validateMassOrder(userId, projectId, entries);

        if (!validation.hasSufficientBalance) {
            return NextResponse.json({
                error: 'Payment Required: Insufficient balance',
                required: validation.totalBatchAmount.toNumber(),
                available: validation.user.balance.toNumber()
            }, { status: 402 });
        }

        // 2. Execute the order
        const result = await MassOrderService.processMassOrder(userId, projectId, entries);

        return NextResponse.json({
            success: true,
            order: {
                batchId: result.batchId,
                totalAmount: result.totalAmount.toNumber(),
                status: 'PROCESSING'
            }
        }, { status: 201 });

    } catch (error: any) {
        // Safe error handling to not leak internal DB errors
        const message = error.message || 'Internal Server Error';
        const status = message.includes('User not found') ? 401 : 500;

        console.error('[API_ERROR] /api/v1/orders:', error);

        return NextResponse.json({
            error: status === 500 ? 'An unexpected error occurred processing your request' : message
        }, { status });
    }
}
