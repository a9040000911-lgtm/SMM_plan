/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 *
 * Root Middleware — centralized route protection.
 * Prevents unauthorized access to /admin/* and /api/admin/* paths.
 * This is the FIRST line of defense (V-04 audit fix).
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_SESSION_COOKIE = 'admin_session';

/**
 * Lightweight JWT verification for Edge Runtime.
 * Only checks signature validity and expiration — no DB calls.
 */
async function verifySessionToken(token: string): Promise<boolean> {
    try {
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) return false;

        const key = new TextEncoder().encode(secret);
        await jwtVerify(token, key);
        return true;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── Allow public admin routes ──
    // Login page and auth API must be accessible without session
    if (
        pathname === '/admin/login' ||
        pathname.startsWith('/api/admin/auth')
    ) {
        return NextResponse.next();
    }

    // ── Protect all /admin/* pages ──
    if (pathname.startsWith('/admin')) {
        const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE);

        if (!sessionCookie?.value) {
            // No cookie → redirect to login
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }

        const isValid = await verifySessionToken(sessionCookie.value);
        if (!isValid) {
            // Expired / tampered token → clear cookie and redirect
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            const response = NextResponse.redirect(loginUrl);
            response.cookies.delete(ADMIN_SESSION_COOKIE);
            return response;
        }

        return NextResponse.next();
    }

    // ── Protect all /api/admin/* endpoints ──
    if (pathname.startsWith('/api/admin')) {
        const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE);

        if (!sessionCookie?.value) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Admin session required' },
                { status: 401 }
            );
        }

        const isValid = await verifySessionToken(sessionCookie.value);
        if (!isValid) {
            const response = NextResponse.json(
                { error: 'Unauthorized', message: 'Session expired or invalid' },
                { status: 401 }
            );
            response.cookies.delete(ADMIN_SESSION_COOKIE);
            return response;
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match admin pages and API routes
        '/admin/:path*',
        '/api/admin/:path*',
    ],
};
