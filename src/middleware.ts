import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getRealIp } from '@/services/core/rate-limiter';

const protectedAdminApiPaths = ['/api/admin'];
const protectedAdminUiPaths = ['/admin'];
const excludedPaths = ['/admin/login', '/api/admin/auth'];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 1. IP and Rate Limiting for auth/admin
    if (pathname.startsWith('/api/admin/auth') || pathname.startsWith('/admin/login')) {
        const ip = getRealIp(req);
        // Using checkRateLimit (from core service)
        const rl = await checkRateLimit('admin_auth', ip);
        if (!rl.success) {
            return new NextResponse(
                JSON.stringify({ error: 'Слишком много попыток входа. Пожалуйста, подождите.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // 2. Global Admin Protection (V-04)
    const isProtectedApi = protectedAdminApiPaths.some(p => pathname.startsWith(p));
    const isProtectedUi = protectedAdminUiPaths.some(p => pathname.startsWith(p));
    const isExcluded = excludedPaths.some(p => pathname.startsWith(p));

    if ((isProtectedApi || isProtectedUi) && !isExcluded) {
        // Retrieve the admin session cookie. In Smmplan, the session cookie is typically 'admin_session' or 'next-auth.session-token'.
        // Let's rely on standard check: `admin_session` 
        const hasSession = req.cookies.has('admin_session');
        
        if (!hasSession) {
            if (isProtectedApi) {
                return new NextResponse(
                    JSON.stringify({ error: 'Unauthorized: Session missing' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            } else {
                return NextResponse.redirect(new URL('/admin/login', req.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public images
         */
        '/((?!_next/static|_next/image|favicon.ico|images/).*)',
    ],
};
