/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { MAINTENANCE_TEMPLATE } from '@/templates/maintenance';
import { getRealIp, checkRateLimit } from '@/services/core/rate-limiter';
import { verifyAdminSession } from '@/services/core/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- SECURITY: BLOCK NEXT-RESUME (GHSA-5f7q-jpqc-wp7h) ---
  if (request.headers.has('next-resume')) {
    const ip = request.headers.get('x-forwarded-for') || (request as any).ip || 'unknown';
    console.warn(`[Security Alert] Blocked request with Next-Resume header from ${ip}`);
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden: Restricted Header' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  // --- IMMEDIATE BYPASS FOR STATIC & INTERNAL ---
  // If it's a file (has extension) or internal Next.js/API request, bypass proxy immediately.
  const isStaticOrInternal =
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/internal') ||
    /\.(ico|png|jpg|jpeg|svg|webp|webmanifest|txt|xml|json)$/i.test(pathname);

  if (isStaticOrInternal) {
    return NextResponse.next();
  }

  // --- 1. РЕДИРЕКТЫ АВТОРИЗАЦИИ ---
  // Исправляем 404, если кто-то обращается по старому адресу NextAuth
  if (pathname === '/auth/signin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- RATE LIMITING (UPSTASH) ---
  const ip = getRealIp(request);
  try {
    // 1. Check for Admin Bypass (Global Admins don't have limits)
    const sessionCookie = request.cookies.get('admin_session');
    let isGlobalAdmin = false;
    if (sessionCookie?.value) {
      const adminSession = await verifyAdminSession(sessionCookie.value);
      if (adminSession?.isGlobalAdmin) {
        isGlobalAdmin = true;
      }
    }

    if (!isGlobalAdmin) {
      if (pathname.startsWith('/api/auth/')) {
        const { success, limit, reset, remaining } = await checkRateLimit('auth', ip);
        if (!success) {
          return new NextResponse(
            JSON.stringify({ error: 'Слишком много попыток входа. Пожалуйста, подождите минуту.', retryAfter: Math.ceil((reset - Date.now()) / 1000) }),
            { status: 429, headers: { 'Content-Type': 'application/json', 'X-RateLimit-Limit': limit.toString(), 'X-RateLimit-Remaining': remaining.toString(), 'X-RateLimit-Reset': reset.toString() } }
          );
        }
      } else if (pathname.startsWith('/api/client/') || pathname.startsWith('/api/tma/')) {
        const { success, limit, reset, remaining } = await checkRateLimit('api', ip);
        if (!success) {
          return new NextResponse(
            JSON.stringify({ error: 'Превышен лимит запросов к API. Пожалуйста, сбавьте темп.', retryAfter: Math.ceil((reset - Date.now()) / 1000) }),
            { status: 429, headers: { 'Content-Type': 'application/json', 'X-RateLimit-Limit': limit.toString(), 'X-RateLimit-Remaining': remaining.toString(), 'X-RateLimit-Reset': reset.toString() } }
          );
        }
      } else {
        const { success } = await checkRateLimit('public', ip);
        if (!success) {
          return new NextResponse('429 Too Many Requests - Please wait a moment before refreshing the page.', { status: 429 });
        }
      }
    }
  } catch (error) {
    console.error('Rate Limiting Error:', error);
  }

  // --- PREPARE HEADERS FOR PAGES & MULTI-TENANT ---
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  let hostname = request.headers.get('host') || 'smmplan.ru';
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      // SECURITY: mock_tenant only allowed in explicit development mode
      if (process.env.NODE_ENV === 'development') {
          const mockTenant = request.nextUrl.searchParams.get('mock_tenant');
          if (mockTenant) hostname = mockTenant;
          else hostname = 'smmplan.ru';
      } else {
          hostname = 'smmplan.ru';
      }
  }
  requestHeaders.set('x-tenant-domain', hostname);
  
  let tenantSiteId = '1';
  if (hostname.includes('cryptoboost')) tenantSiteId = '2';
  if (hostname.includes('instaboost')) tenantSiteId = '3';
  requestHeaders.set('x-tenant-id', tenantSiteId);

  // --- ADMIN & API AUTH CHECK ---
  const isAdminPath = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth');

  if (isAdminPath || isAdminApi) {
    const sessionCookie = request.cookies.get('admin_session');
    let isValidSession = false;

    if (sessionCookie?.value) {
      const adminSession = await verifyAdminSession(sessionCookie.value);
      if (adminSession && adminSession.id) {
        isValidSession = true;
      }
    }

    if (!isValidSession) {
      if (isAdminApi) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
      }
      const loginUrl = new URL('/admin/login', request.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('admin_session'); // Clean up invalid cookie
      return res;
    }
  }

  // --- MAINTENANCE MODE CHECK ---
  const isExcluded = pathname.startsWith('/admin') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/_next');

  if (!isExcluded) {
    try {
      const host = request.headers.get('host') || 'localhost';
      const domain = host.split(':')[0];

      // FIX: Use internal loopback (v4) for maintenance check to avoid SSL/Hairpin NAT issues.
      // 127.0.0.1:3000 refers to the current container itself (standlone server).
      const internalBaseUrl = 'http://127.0.0.1:3000';
      const lookupUrl = new URL(`/api/internal/project-lookup?domain=${domain}`, internalBaseUrl);

      const projectRes = await fetch(lookupUrl);

      if (projectRes.ok) {
        const { project } = await projectRes.json();
        if (project?.maintenanceMode) {
          return new NextResponse(
            MAINTENANCE_TEMPLATE,
            {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        }
      }
    } catch (e) {
      console.error('Middleware maintenance check error:', e);
    }
  }

  // --- MULTI-SITE REWRITE ---
  const secondaryDomains = (process.env.SECONDARY_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean);
  const host = request.headers.get('host') || '';
  const domain = host.split(':')[0];
  const isSecondSite = secondaryDomains.includes(domain) || host.includes('smmgold.local');
  const isSystemPath = pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.');

  // Исключаем страницы авторизации из рерайта
  const isAuthPath = pathname === '/login' || pathname === '/register';

  let response;

  if (isSystemPath) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (isSecondSite && !isSystemPath && !isAuthPath) {
    // Используем premium-site (актуальное название папки)
    response = NextResponse.rewrite(new URL(`/premium-site${pathname}`, request.url), {
      request: { headers: requestHeaders }
    });
  } else {
    response = NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // --- SECURITY HEADERS ---
  response.headers.set('x-pathname', pathname);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-ancestors 'none';");

  // --- CORS ---
  const origin = request.headers.get('origin');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-project-id, tma');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/internal|_next/static|_next/image|favicon.ico).*)',
  ],
};


