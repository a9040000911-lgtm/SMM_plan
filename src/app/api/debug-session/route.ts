/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/utils/admin-session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getAdminSession();
        const cookieStore = await cookies();
        const adminSessionCookie = cookieStore.get('admin_session');

        return NextResponse.json({
            hasSession: !!session,
            session,
            hasCookie: !!adminSessionCookie,
            cookieLength: adminSessionCookie?.value?.length || 0,
            headers: Object.fromEntries(req.headers.entries()),
            env_node_env: process.env.NODE_ENV
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


