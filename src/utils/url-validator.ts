/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { URL } from 'url';

/**
 * Checks if a URL is safe for server-side requests (prevents SSRF).
 * Blocks loopback, private IPv4, and non-http(s) protocols.
 */
export function isSafeUrl(urlStr: string): boolean {
    try {
        const url = new URL(urlStr);

        // Allow only HTTP/HTTPS
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return false;
        }

        const hostname = url.hostname.toLowerCase();

        // 1. Block known loopback and local hostnames
        // MUST NEVER allow loopback in production, even with flag.
        const isProd = process.env.NODE_ENV === 'production';
        if (isProd && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.local'))) {
            return false;
        }

        // 2. Block private IPv4 ranges (RFC 1918)
        // 10.0.0.0/8
        // 172.16.0.0/12
        // 192.168.0.0/16
        // 169.254.0.0/16 (Link-local)
        
        // Simple regex for private IPs
        const privateIpRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/;
        if (isProd && (privateIpRegex.test(hostname) || hostname.startsWith('127.'))) {
            return false;
        }

        // 3. [SECURITY] Block cloud metadata endpoints (AWS, GCP, Azure)
        const cloudMetadataHosts = [
            '169.254.169.254',          // AWS EC2 / GCP metadata
            'metadata.google.internal', // GCP metadata v2
            '100.100.100.200',          // Alibaba Cloud metadata
            '169.254.169.253'           // Additional aliasing
        ];
        if (cloudMetadataHosts.includes(hostname)) {
            return false;
        }

        // 4. [SECURITY] Block .internal and .test TLDs in production
        if (isProd && (hostname.endsWith('.internal') || hostname.endsWith('.test'))) {
            return false;
        }

        // 5. [SECURITY] Block URLs with embedded credentials (user:pass@host)
        if (url.username || url.password) {
            return false;
        }

        return true;
    } catch (_e) {
        return false;
    }
}

/**
 * Validates a URL and throws an error if it's unsafe.
 */
export function validateSafeUrl(url: string, context: string = 'Request'): void {
    if (!isSafeUrl(url)) {
        throw new Error(`[Security] Potential SSRF detected: ${context} to unsafe URL "${url}" is blocked.`);
    }
}


