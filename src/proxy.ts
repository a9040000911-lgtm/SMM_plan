/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextRequest } from 'next/server';
import { proxy as handleProxy } from './utils/proxy-logic';

/**
 * Global Proxy for Smmplan (Next.js 16 Convention)
 * This is the entry point for all requests.
 */
export async function proxy(request: NextRequest) {
    // Use the existing proxy logic which handles rate limiting, admin auth, and rewrites
    return await handleProxy(request);
}

// Next.js 16 expects 'proxy' or default export in proxy.ts
export default proxy;

/**
 * Configure which paths are processed by the proxy.
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
