/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Smmplan HTML Sanitizer Utility (v7.10)
 * Protects against XSS by stripping dangerous tags and attributes.
 */

export function sanitizeHtml(html: string): string {
    if (!html) return '';

    // 1. Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 2. Remove dangerous event handlers (onmouseover, onclick, etc.)
    sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, '');
    sanitized = sanitized.replace(/\son\w+='[^']*'/gi, '');
    sanitized = sanitized.replace(/\son\w+=[^\s>]+/gi, '');

    // 3. Remove javascript: pseudo-protocol in href/src
    sanitized = sanitized.replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"');
    sanitized = sanitized.replace(/src\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'src=""');

    // 4. Remove other dangerous tags (object, embed, iframe - unless explicitly allowed)
    // For Smmplan, we don't need these in documents.
    sanitized = sanitized.replace(/<(object|embed|iframe|form|meta|link|style)\b[^<]*\/?>/gi, '');

    return sanitized;
}


