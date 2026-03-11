/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Security Headers Configuration
 * Following OWASP best practices for Next.js applications.
 */

const ContentSecurityPolicy = `
  default-src 'self' *;
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://telegram.org https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: *;
  font-src 'self' data: https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  connect-src 'self' *;
  frame-src 'self' https://telegram.org;
  frame-ancestors 'self';
  manifest-src 'self' *;
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
    {
        key: 'Content-Security-Policy',
        value: ContentSecurityPolicy,
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
    },
    /* HSTS disabled for local/multi-domain debugging
        {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
        },
    */
];

module.exports = securityHeaders;
