import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Provider API Router (PerfectPanel / standard SMM Panel format)
 * Используется для сквозного тестирования платформы без отправки реальных денег или заказов.
 */
export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let body: any = {};
        
        if (contentType.includes('application/json')) {
            body = await req.json();
        } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            formData.forEach((value, key) => {
                body[key] = value;
            });
        }
        
        const key = body.key || new URL(req.url).searchParams.get('key');
        const action = body.action || new URL(req.url).searchParams.get('action');

        if (!key || key !== 'TEST_API_KEY_123') {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
        }

        switch (action) {
            case 'services': {
                // Возвращаем динамический список услуг из базы, если передан alias
                const alias = new URL(req.url).searchParams.get('alias') || body.alias;
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const dbPath = path.join(process.cwd(), 'prisma', 'mock_api_db.json');
                    if (fs.existsSync(dbPath)) {
                        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                        if (alias && db[alias]) {
                            return NextResponse.json(db[alias]);
                        }
                    }
                } catch(e) {
                    console.error("Mock DB error:", e);
                }

                // Fallback
                return NextResponse.json([
                    { service: 100, name: "TEST: Instagram Followers [Guaranteed]", type: "Default", category: "Instagram", rate: "0.50", min: 10, max: 10000, dripfeed: false },
                    { service: 101, name: "TEST: Telegram Views [Instant]", type: "Default", category: "Telegram", rate: "0.10", min: 100, max: 50000, dripfeed: true },
                    { service: 102, name: "TEST: YouTube Likes", type: "Default", category: "YouTube", rate: "1.20", min: 50, max: 5000, dripfeed: false }
                ]);
            }

            case 'add': {
                // Имитация успешного создания заказа
                if (!body.service || !body.link || !body.quantity) {
                    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
                }
                const mockOrderId = Math.floor(Math.random() * 1000000);
                return NextResponse.json({ order: mockOrderId });
            }

            case 'status':
                // Имитация проверки статуса
                if (!body.order && !body.orders) {
                    return NextResponse.json({ error: 'Missing order field' }, { status: 400 });
                }
                if (body.orders) {
                    // Multi-status
                    const ids = String(body.orders).split(',');
                    const result: any = {};
                    ids.forEach((id: string) => {
                        // Мок-логика: если ID четный - завершен, нечетный - в процессе
                        const isCompleted = parseInt(id) % 2 === 0;
                        result[id] = {
                            status: isCompleted ? "Completed" : "Processing",
                            start_count: 500,
                            remains: isCompleted ? 0 : 200,
                            currency: "USD"
                        };
                    });
                    return NextResponse.json(result);
                }
                
                // Single status
                return NextResponse.json({
                    status: "Completed",
                    start_count: 1000,
                    remains: 0,
                    currency: "USD"
                });

            case 'balance':
                return NextResponse.json({
                    balance: "9999.00",
                    currency: "USD"
                });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
    }
}
