/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAdminSession } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const results: any = {
        timestamp: new Date().toISOString(),
        db: 'starting',
        jwt: 'starting',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
            HOSTNAME: process.env.HOSTNAME
        }
    };

    try {
        const startDb = Date.now();
        const userCount = await prisma.user.count();
        results.db = `ok (${userCount} users, ${Date.now() - startDb}ms)`;
    } catch (err: any) {
        results.db = `ERROR: ${err.message}`;
    }

    try {
        const startJwt = Date.now();
        const token = await signAdminSession({
            id: 'test-id',
            tgId: null,
            role: 'ADMIN',
            username: 'test',
            isGlobalAdmin: true,
            allowedProjects: []
        });
        results.jwt = `ok (${token.length} chars, ${Date.now() - startJwt}ms)`;
    } catch (err: any) {
        results.jwt = `ERROR: ${err.message}`;
    }

    return NextResponse.json(results);
}
