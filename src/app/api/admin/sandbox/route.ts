/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 * 
 * Admin API: Sandbox Mode Management
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/utils/admin-session';
import { SandboxService } from '@/services/core/sandbox.service';

export async function GET() {
    const session = await getAdminSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await SandboxService.getStatus();
    return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
    const session = await getAdminSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ttlMinutes } = body;

    switch (action) {
        case 'enable':
            await SandboxService.enable(session.id, ttlMinutes || 120);
            return NextResponse.json({ success: true, message: 'Sandbox enabled' });

        case 'disable':
            await SandboxService.disable(session.id, 'manual');
            return NextResponse.json({ success: true, message: 'Sandbox disabled' });

        case 'purge': {
            const result = await SandboxService.purgeTestData(session.id);
            return NextResponse.json({ success: true, ...result });
        }

        default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
}
