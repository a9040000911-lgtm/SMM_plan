/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextRequest } from 'next/server';
import { proxy as handleProxy } from './utils/proxy-logic';

/**
 * Global Middleware for Smmplan
 * This is the entry point for all requests.
 * It handles:
 * 1. Security headers
 * 2. Rate limiting
 * 3. Support/Admin authorization
 * 4. Multi-site rewrites
 */
export async function proxy(request: NextRequest) {
    // Use the existing proxy logic which handles rate limiting, admin auth, and rewrites
    return await handleProxy(request);
}

/**
 * Configure which paths are processed by the middleware.
 * We include everything except static assets and internal API.
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/internal (internal cluster communication)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, icons etc)
         */
        '/((?!api/internal|_next/static|_next/image|favicon.ico|.*\\.).*)',
    ],
};


