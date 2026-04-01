import { headers } from 'next/headers';

/**
 * Returns the active project tenant based on the incoming domain request.
 * Resolves to the Smmplan site_id.
 */
export async function getTenantId(): Promise<number> {
    const headersList = await headers();
    const siteIdHeader = headersList.get('x-tenant-id');
    if (!siteIdHeader) return 1; // Default Main Project
    
    const parsed = parseInt(siteIdHeader, 10);
    return isNaN(parsed) ? 1 : parsed;
}

/**
 * Returns the incoming domain request hostname.
 */
export async function getTenantDomain(): Promise<string> {
    const headersList = await headers();
    const domainHeader = headersList.get('x-tenant-domain');
    return domainHeader || 'smmplan.ru';
}

/**
 * Common App/Project configuration map
 */
export const TenantConfigMap: Record<number, { name: string, description: string, theme: 'default' | 'crypto' | 'beauty', currency: string }> = {
    1: {
        name: 'Smmplan',
        description: 'Профессиональная B2B SMM-платформа №1. Продвижение в Telegram, Instagram, VK. API для бизнеса.',
        theme: 'default',
        currency: 'RUB'
    },
    2: {
        name: 'CryptoBoost',
        description: 'Turbo-charge your Web3/NFT brand. Global Telegram & Twitter Promotion with premium audiences.',
        theme: 'crypto', // Dark neon theme
        currency: 'USD'
    },
    3: {
        name: 'InstaBoost',
        description: 'Органическое премиум-продвижение для блогеров. Лайки и подписчики без рисков для охвата.',
        theme: 'beauty', // Pastel pink/glass theme
        currency: 'RUB'
    }
};

/**
 * Helper to fetch config for active tenant
 */
export async function getTenantConfig() {
    const siteId = await getTenantId();
    return TenantConfigMap[siteId] || TenantConfigMap[1];
}
