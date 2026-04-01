import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

// Store mock orders in global memory so they survive HMR in dev mode
const globalAny: any = global;
if (!globalAny.mockOrders) {
    globalAny.mockOrders = new Map<number, any>();
    globalAny.mockOrderIdCounter = 900000;
}
const mockOrders = globalAny.mockOrders as Map<number, any>;

export async function POST(req: Request) {
    // --- ENV/DB GUARD: мок-провайдер работает ТОЛЬКО если явно включён ---
    let isMockEnabled = process.env.MOCK_PROVIDER_ENABLED === 'true';
    const dbMockSetting = await prisma.globalSetting.findUnique({ where: { key: 'MOCK_PROVIDER_ENABLED' } });
    if (dbMockSetting?.value === 'true') isMockEnabled = true;

    if (!isMockEnabled) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const text = await req.text();
    const params = new URLSearchParams(text);
    
    const key = params.get('key');
    const action = params.get('action');

    if (!key) {
        return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
    }

    if (action === 'balance') {
        if (key === 'MODE:EMPTY') return NextResponse.json({ balance: "0.01", currency: "USD" });
        if (key === 'MODE:ERROR') return NextResponse.json({ error: "Account suspended" });
        if (key === 'CURRENCY:RUB') return NextResponse.json({ balance: "150000.00", currency: "RUB" });
        return NextResponse.json({ balance: "5000.00", currency: "USD" });
    }

    if (action === 'services') {
        if (key === 'MODE:ERROR') return NextResponse.json({ error: "Service Unavailable" });

        const searchParams = new URL(req.url).searchParams;
        const mockName = params.get('mockName') || searchParams.get('mockName') || 'vexboost';
        
        // Prevent Path Traversal by strictly validating the mockName pattern
        if (!/^[a-zA-Z0-9_-]+$/.test(mockName)) {
            return NextResponse.json({ error: "Invalid mock provider name format" }, { status: 400 });
        }
        
        let snapshotPath = path.join(process.cwd(), `src/app/api/dev/mock-provider/snapshots/${mockName}-snapshot.json`);
        // Fallback for old vexboost
        if (mockName === 'vexboost' && !fs.existsSync(snapshotPath)) {
             snapshotPath = path.join(process.cwd(), 'src/app/api/dev/mock-provider/vexboost-snapshot.json');
        }

        let rawServices = [];
        try {
            const fileData = fs.readFileSync(snapshotPath, 'utf-8');
            rawServices = JSON.parse(fileData);
        } catch(e) {
            return NextResponse.json({ error: `Snapshot missing at ${snapshotPath}` });
        }

        if (key === 'MODE:CHAOS_PRICE') {
            rawServices = rawServices.map((s: any) => ({
                ...s,
                rate: (parseFloat(s.rate) * 5.5).toFixed(4)
            }));
        } else if (key === 'MODE:CHAOS_NAME') {
            rawServices = rawServices.map((s: any) => ({
                ...s,
                name: s.name.replace(/non.?drop/i, 'Fast Drop (Bots)')
            }));
        } else if (key === 'MODE:CHAOS_DROP') {
            // Эмуляция отвала услуг VexBoost: просто вырезаем все сервисы содержащие 'Telegram'
            rawServices = rawServices.filter((s: any) => !s.name.includes('Telegram') && !s.category.includes('Telegram'));
        }

        return NextResponse.json(rawServices);
    }

    if (action === 'add') {
        if (key === 'MODE:ERROR') return NextResponse.json({ error: "API down" });
        if (key === 'MODE:EMPTY') return NextResponse.json({ error: "Not enough funds on balance" });

        const service = params.get('service');
        const link = params.get('link');
        const quantity = parseInt(params.get('quantity') || '0');

        if (link?.includes('/fail')) {
            return NextResponse.json({ error: "Incorrect Link" });
        }

        const orderId = globalAny.mockOrderIdCounter++;
        
        mockOrders.set(orderId, {
            id: orderId,
            service,
            link,
            quantity,
            start_count: 0,
            remains: quantity,
            status: 'Pending',
            currency: key === 'CURRENCY:RUB' ? 'RUB' : 'USD',
            createdAt: Date.now(),
            chaos_hang: link?.includes('/hang')
        });

        return NextResponse.json({ order: orderId });
    }

    if (action === 'status') {
        const orderParam = params.get('order');
        if (!orderParam) return NextResponse.json({ error: "Missing order ID" });

        const orderIds = orderParam.split(',').map(n => parseInt(n.trim()));
        const responseData: Record<string, any> = {};
        const now = Date.now();

        orderIds.forEach(id => {
            const order = mockOrders.get(id);
            if (!order) {
                responseData[id] = { error: "Incorrect order ID" };
                return;
            }

            if (key === 'MODE:ERROR') {
                responseData[id] = { error: "Database error inside mock" };
                return;
            }

            const ageMs = now - order.createdAt;
            const ageMinutes = ageMs / 60000;

            if (order.chaos_hang) {
                // Stays Pending
            } else if (ageMinutes > 15) {
                order.status = 'Completed';
                order.remains = 0;
            } else if (ageMinutes > 10) {
                if (order.quantity > 500 && order.id % 2 === 0) {
                    order.status = 'Partial';
                    order.remains = Math.floor(order.quantity / 2);
                } else {
                    order.status = 'Processing';
                    order.remains = Math.floor(order.quantity * 0.2);
                }
            } else if (ageMinutes > 5) {
                order.status = 'In progress';
                order.remains = order.quantity;
            }

            responseData[id] = {
                status: order.status,
                remains: order.remains.toString(),
                start_count: order.start_count.toString(),
                currency: order.currency
            };
        });

        if (orderIds.length === 1 && !orderParam.includes(',')) {
            return NextResponse.json(responseData[orderIds[0]]);
        }

        return NextResponse.json(responseData);
    }

    return NextResponse.json({ error: "Incorrect request" }, { status: 400 });
}
