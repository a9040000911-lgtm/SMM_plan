/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Decimal } from 'decimal.js';

/**
 * Utility to recursively sanitize objects, converting Decimal fields to numbers.
 * This is crucial for passing data from Server Components to Client Components in Next.js.
 */
export function sanitizeData(data: any): any {
    if (data === null || data === undefined) {
        return data;
    }

    // Handle BigInt
    if (typeof data === 'bigint') {
        return data.toString();
    }

    // Handle Decimal (decimal.js, decimal.js-light, or Prisma's version)
    if (typeof data === 'object' && (
        data instanceof Decimal ||
        data.constructor?.name === 'Decimal' ||
        data._isDecimal === true ||
        (typeof data.toNumber === 'function' && typeof data.toFixed === 'function')
    )) {
        return data.toNumber();
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    if (typeof data === 'object') {
        // Skip nulls or dates (Dates are fine in Next.js props)
        if (data instanceof Date) return data;

        const sanitized: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                sanitized[key] = sanitizeData(data[key]);
            }
        }
        return sanitized;
    }

    return data;
}

/**
 * Specific sanitizer for InternalService objects to ensure consistency.
 */
export function sanitizeService(service: any) {
    if (!service) return null;
    return {
        ...service,
        pricePer1000: service.pricePer1000 instanceof Decimal ? service.pricePer1000.toNumber() : Number(service.pricePer1000),
        lastProviderPrice: service.lastProviderPrice ? (service.lastProviderPrice instanceof Decimal ? service.lastProviderPrice.toNumber() : Number(service.lastProviderPrice)) : null,
        providerPriceOriginal: service.providerPriceOriginal ? (service.providerPriceOriginal instanceof Decimal ? service.providerPriceOriginal.toNumber() : Number(service.providerPriceOriginal)) : null,
        providerCurrencyOriginal: service.providerCurrencyOriginal,
        marketPrice: service.marketPrice ? (service.marketPrice instanceof Decimal ? service.marketPrice.toNumber() : Number(service.marketPrice)) : null,
        providerMappings: service.providerMappings?.map((m: any) => ({
            ...m,
            provider: m.provider ? {
                id: m.provider.id,
                name: m.provider.name,
                type: m.provider.type,
                balanceThreshold: m.provider.balanceThreshold instanceof Decimal ? m.provider.balanceThreshold.toNumber() : Number(m.provider.balanceThreshold || 0)
            } : null,
            providerService: m.providerService ? {
                id: m.providerService.id,
                name: m.providerService.name,
                rawPrice: m.providerService.rawPrice instanceof Decimal ? m.providerService.rawPrice.toNumber() : Number(m.providerService.rawPrice),
                rawPriceOriginal: m.providerService.rawPriceOriginal ? (m.providerService.rawPriceOriginal instanceof Decimal ? m.providerService.rawPriceOriginal.toNumber() : Number(m.providerService.rawPriceOriginal)) : null,
                rawCurrencyOriginal: m.providerService.rawCurrencyOriginal
            } : null
        }))
    };
}

/**
 * Очищает описания и названия услуг от технического мусора провайдеров
 * (id серверов, домены, ссылки, лишние теги в скобках).
 */
export function sanitizeGarbageFromText(text: string | null | undefined): string {
    if (!text) return "";
    let cleaned = String(text);

    // Удаляем любые URL-адреса
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
    
    // Удаляем типичный мусор провайдеров: server id, provider id
    cleaned = cleaned.replace(/id:\s*\d+/gi, '');
    cleaned = cleaned.replace(/provider:\s*\d+/gi, '');
    cleaned = cleaned.replace(/server:\s*\d+/gi, '');
    
    // Удаляем текст в квадратных скобках, если он похож на ID [1234] или домен [smmpanel.com]
    cleaned = cleaned.replace(/\[\d+\]/g, ''); 
    cleaned = cleaned.replace(/\[[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\]/g, '');
    
    // Чистим множественные пробелы возникшие после удаления
    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    return cleaned.trim();
}
