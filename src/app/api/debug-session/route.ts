/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/services/core/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // SECURITY: Only allow in development mode AND with valid admin session
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const sessionCookie = req.cookies.get('admin_session');
    if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSession = await verifyAdminSession(sessionCookie.value);
    if (!adminSession?.isGlobalAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
        hasSession: true,
        sessionId: adminSession.id,
        role: adminSession.role,
    });
}
