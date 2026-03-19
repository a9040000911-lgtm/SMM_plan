/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
/**
 * Smmplan HTML Sanitizer Utility (v7.10)
 * Protects against XSS by stripping dangerous tags and attributes.
 */

import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
    if (!html) return '';

    // Advanced XSS protection stripping all dangerous tags and attributes
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div'
        ],
        ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'style'],
        ALLOW_DATA_ATTR: false,
    }) as string;
}

