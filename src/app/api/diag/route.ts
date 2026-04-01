/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/services/core/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // SECURITY: Require authenticated Global Admin session
    const sessionCookie = req.cookies.get('admin_session');
    if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const adminSession = await verifyAdminSession(sessionCookie.value);
    if (!adminSession?.isGlobalAdmin) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const results: any = {
        timestamp: new Date().toISOString(),
        db: 'starting',
    };

    try {
        const startDb = Date.now();
        const userCount = await prisma.user.count();
        results.db = `ok (${userCount} users, ${Date.now() - startDb}ms)`;
    } catch (err: any) {
        results.db = `ERROR: ${err.message}`;
    }

    return NextResponse.json(results);
}
