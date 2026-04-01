/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 *
 * [SECURITY] Centralized Zod schemas for runtime API input validation.
 * Prevents __proto__ pollution, type coercion attacks, and unexpected fields.
 */
import { z } from 'zod';

// ==========================================
// SSRF Protection (Internal IP checks)
// ==========================================
const isInternalUrl = (urlStr: string) => {
    try {
        const u = new URL(urlStr);
        const host = u.hostname;
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return true;
        if (/^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
        const match = host.match(/^172\.(\d+)\./);
        if (match && parseInt(match[1], 10) >= 16 && parseInt(match[1], 10) <= 31) return true;
        return false;
    } catch { return false; }
};

const safeApiUrlSchema = z.string().url().max(500).refine(val => !isInternalUrl(val), {
    message: "Invalid API URL (SSRF protection blocked internal address)"
});

// ==========================================
// Provider Management (Admin API)
// ==========================================

export const providerActionSchema = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('create'),
        name: z.string().min(1).max(100),
        type: z.string().max(50).optional().default('universal'),
        apiKey: z.string().min(1).max(500),
        apiUrl: safeApiUrlSchema,
        isEnabled: z.boolean().optional().default(true),
        pricesCurrency: z.enum(['USD', 'RUB', 'EUR', 'UAH']).optional().default('USD'),
        balanceCurrency: z.enum(['USD', 'RUB', 'EUR', 'UAH']).optional().default('USD'),
    }),
    z.object({
        action: z.literal('update'),
        providerId: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        type: z.string().max(50).optional(),
        apiKey: z.string().max(500).optional(),
        apiUrl: safeApiUrlSchema.optional(),
        isEnabled: z.boolean().optional(),
        pricesCurrency: z.enum(['USD', 'RUB', 'EUR', 'UAH']).optional(),
        balanceCurrency: z.enum(['USD', 'RUB', 'EUR', 'UAH']).optional(),
    }),
    z.object({
        action: z.literal('delete'),
        providerId: z.string().uuid(),
    }),
    z.object({
        action: z.literal('sync_all'),
    }),
    z.object({
        action: z.literal('sync_provider'),
        providerId: z.string().uuid(),
    }),
]);

// ==========================================
// Client Orders API
// ==========================================

export const singleOrderSchema = z.object({
    serviceId: z.union([z.string(), z.number()]),
    link: z.string().min(1).max(2000),
    quantity: z.number().int().positive().max(10_000_000),
    isDripFeed: z.boolean().optional().default(false),
    runs: z.number().int().min(2).max(100).optional(),
    interval: z.number().int().min(1).max(1440).optional(),
    comments: z.string().max(5000).optional(),
});

export const massOrderItemSchema = z.object({
    serviceId: z.union([z.string(), z.number()]).transform(String),
    link: z.string().min(1).max(2000),
    quantity: z.union([z.number(), z.string()]).transform(Number),
    isDripFeed: z.boolean().optional(),
    runs: z.number().int().min(2).max(100).optional(),
    interval: z.number().int().min(1).max(1440).optional(),
}).passthrough();

export const massOrderSchema = z.object({
    orders: z.array(massOrderItemSchema).min(1).max(500),
});

export const clientCheckoutSchema = z.object({
    // Auth & Guest
    email: z.string().email().max(255).optional(),
    password: z.string().max(255).optional(),
    magicCode: z.string().max(10).optional(),

    // Payment & Discounts
    coupon: z.string().max(50).optional(),
    pointsToUse: z.number().int().min(0).max(1_000_000).optional(),
    payWithFunds: z.boolean().optional(),
    paymentMethod: z.enum(['YOOKASSA', 'ROBOKASSA', 'CRYPTO', 'BALANCE', 'FREE']).optional(),

    // Single order
    serviceId: z.union([z.string(), z.number()]).transform(String).optional(),
    link: z.string().max(2000).optional(),
    quantity: z.union([z.number(), z.string()]).transform(Number).optional(),
    isDripFeed: z.boolean().optional(),
    runs: z.number().int().min(2).max(100).optional(),
    interval: z.number().int().min(1).max(1440).optional(),
    
    // Batch elements
    links: z.array(z.string().max(2000)).max(500).optional(),
    items: z.array(massOrderItemSchema).max(500).optional(),
    batch: z.array(massOrderItemSchema).max(500).optional(),
}).passthrough();

// ==========================================
// V2 Reseller API (formData-based, validated post-parse)
// ==========================================

export const v2AddOrderSchema = z.object({
    service: z.string().min(1),
    link: z.string().min(1).max(2000),
    quantity: z.number().int().positive().max(10_000_000),
});

export const v2StatusSchema = z.object({
    order: z.union([z.string(), z.number()]),
});

// ==========================================
// Auth Schemas
// ==========================================

export const telegramAuthSchema = z.object({
    id: z.number().int().positive(),
    first_name: z.string().max(200),
    last_name: z.string().max(200).optional(),
    username: z.string().max(200).optional(),
    photo_url: z.string().url().max(1000).optional(),
    auth_date: z.number().int().positive(),
    hash: z.string().length(64),
});

// ==========================================
// Support Tickets
// ==========================================

export const createTicketSchema = z.object({
    subject: z.string().min(1).max(300),
    message: z.string().min(1).max(5000),
    orderId: z.number().int().positive().optional(),
});

export const sendMessageSchema = z.object({
    text: z.string().min(1).max(5000),
    imageUrl: z.string().url().max(2000).optional(),
});

// ==========================================
// Payment Schemas
// ==========================================

export const createPaymentSchema = z.object({
    amount: z.number().positive().max(1_000_000),
    provider: z.enum(['YOOKASSA', 'ROBOKASSA', 'CRYPTO', 'MANUAL']),
    currency: z.enum(['RUB', 'USD', 'EUR', 'UAH']).optional().default('RUB'),
});

// ==========================================
// Settings Schemas
// ==========================================

export const updateSettingSchema = z.object({
    key: z.string().min(1).max(100),
    value: z.string().max(10000),
});

// ==========================================
// Helper: Safe parse with error formatting
// ==========================================

/**
 * Safely parse input with a Zod schema.
 * Returns { success, data, error } — use in API handlers.
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    error?: string;
} {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    
    // Format errors without leaking internal types
    const messages = result.error.issues
        .slice(0, 3)  // Limit to 3 errors to avoid info leak
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
    
    return { success: false, error: `Validation failed: ${messages}` };
}
