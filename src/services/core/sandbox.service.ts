/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 * 
 * SandboxService — Централизованный модуль управления режимом Песочницы.
 * 
 * Архитектура:
 * - Единственная точка принятия решений о Песочнице
 * - Кеширование в Redis (1 мин TTL) для минимизации нагрузки на БД
 * - Auto-disable по TTL (Dead Man's Switch)
 * - Аудитный след через AdminLog
 */
import { prisma } from '@/lib/prisma';

// Redis может быть недоступен в тестах, поэтому ленивый импорт
let redisInstance: any = null;
async function getRedis() {
    if (!redisInstance) {
        try {
            const mod = await import('@/lib/redis');
            redisInstance = mod.redis;
        } catch {
            return null;
        }
    }
    return redisInstance;
}

const REDIS_KEY_ENABLED = 'sandbox:enabled';
const REDIS_KEY_EXPIRES = 'sandbox:expires_at';
const REDIS_KEY_ENABLED_BY = 'sandbox:enabled_by';
const DB_KEY_SANDBOX = 'SANDBOX_MODE_ENABLED';
const DB_KEY_PAYMENT_MODE = 'GLOBAL_PAYMENT_MODE';
const GLOBAL_PROJECT_ID = 'global'; // Settings хранятся с projectId='global'
const CACHE_TTL_SECONDS = 60; // 1 минута

// In-memory fallback cache (для случаев когда Redis недоступен)
let memoryCache: { enabled: boolean; checkedAt: number } | null = null;

export class SandboxService {
    /**
     * Проверяет, включен ли режим Песочницы.
     * Использует Redis-кеш с TTL 1 минута для минимизации запросов к БД.
     */
    static async isEnabled(): Promise<boolean> {
        // 1. Попробовать Redis
        const redis = await getRedis();
        if (redis) {
            try {
                const cached = await redis.get(REDIS_KEY_ENABLED);
                if (cached !== null) {
                    return cached === 'true';
                }
            } catch { /* fallthrough to DB */ }
        }

        // 2. In-memory cache (5 sec, fallback)
        if (memoryCache && Date.now() - memoryCache.checkedAt < 5000) {
            return memoryCache.enabled;
        }

        // 3. DB — используем модель Settings с projectId='global'
        const setting = await prisma.settings.findUnique({
            where: { projectId_key: { projectId: GLOBAL_PROJECT_ID, key: DB_KEY_SANDBOX } }
        });
        const enabled = setting?.value === 'true';

        // Cache в Redis
        if (redis) {
            try {
                await redis.set(REDIS_KEY_ENABLED, String(enabled), 'EX', CACHE_TTL_SECONDS);
            } catch { /* ignore */ }
        }

        // Cache в memory
        memoryCache = { enabled, checkedAt: Date.now() };

        return enabled;
    }

    /**
     * Включает Песочницу с автоматическим таймаутом.
     * @param adminId - ID администратора, включающего режим
     * @param ttlMinutes - Время жизни (по умолчанию 120 минут = 2 часа)
     */
    static async enable(adminId: string, ttlMinutes: number = 120): Promise<void> {
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

        // Атомарное обновление двух настроек
        await prisma.$transaction([
            prisma.settings.upsert({
                where: { projectId_key: { projectId: GLOBAL_PROJECT_ID, key: DB_KEY_SANDBOX } },
                update: { value: 'true' },
                create: { projectId: GLOBAL_PROJECT_ID, key: DB_KEY_SANDBOX, value: 'true' }
            }),
            prisma.settings.upsert({
                where: { projectId_key: { projectId: GLOBAL_PROJECT_ID, key: DB_KEY_PAYMENT_MODE } },
                update: { value: 'TEST' },
                create: { projectId: GLOBAL_PROJECT_ID, key: DB_KEY_PAYMENT_MODE, value: 'TEST' }
            }),
            prisma.adminLog.create({
                data: {
                    adminId,
                    action: 'SANDBOX_ENABLED',
                    details: `Sandbox Mode включен. TTL: ${ttlMinutes} мин. Платежи: TEST. Истекает: ${expiresAt.toISOString()}`,
                    metadata: { ttlMinutes, expiresAt: expiresAt.toISOString() }
                }
            })
        ]);

        // Redis: установить кеш и TTL
        const redis = await getRedis();
        if (redis) {
            try {
                await redis.set(REDIS_KEY_ENABLED, 'true', 'EX', CACHE_TTL_SECONDS);
                await redis.set(REDIS_KEY_EXPIRES, expiresAt.toISOString(), 'EX', ttlMinutes * 60);
                await redis.set(REDIS_KEY_ENABLED_BY, adminId, 'EX', ttlMinutes * 60);
            } catch { /* ignore */ }
        }

        memoryCache = { enabled: true, checkedAt: Date.now() };

        console.log(`[SandboxService] ✅ Sandbox ENABLED by ${adminId}. TTL: ${ttlMinutes}min. Expires: ${expiresAt.toISOString()}`);
    }

    /**
     * Выключает Песочницу и возвращает платёжный режим в PRODUCTION.
     */
    static async disable(adminId: string, reason: string = 'manual'): Promise<void> {
        await prisma.$transaction([
            prisma.settings.upsert({
                where: { projectId_key: { projectId: GLOBAL_PROJECT_ID, key: DB_KEY_SANDBOX } },
                update: { value: 'false' },
                create: { projectId: GLOBAL_PROJECT_ID, key: DB_KEY_SANDBOX, value: 'false' }
            }),
            prisma.settings.upsert({
                where: { projectId_key: { projectId: GLOBAL_PROJECT_ID, key: DB_KEY_PAYMENT_MODE } },
                update: { value: 'PRODUCTION' },
                create: { projectId: GLOBAL_PROJECT_ID, key: DB_KEY_PAYMENT_MODE, value: 'PRODUCTION' }
            }),
            prisma.adminLog.create({
                data: {
                    adminId,
                    action: 'SANDBOX_DISABLED',
                    details: `Sandbox Mode выключен. Причина: ${reason}. Платежи: PRODUCTION.`
                }
            })
        ]);

        // Очистить Redis
        const redis = await getRedis();
        if (redis) {
            try {
                await redis.del(REDIS_KEY_ENABLED, REDIS_KEY_EXPIRES, REDIS_KEY_ENABLED_BY);
            } catch { /* ignore */ }
        }

        memoryCache = { enabled: false, checkedAt: Date.now() };

        console.log(`[SandboxService] ❌ Sandbox DISABLED by ${adminId}. Reason: ${reason}. Payment mode: PRODUCTION`);
    }

    /**
     * Dead Man's Switch: Проверяет, истёк ли TTL, и автоматически отключает Песочницу.
     * Вызывается из syncWorker каждый цикл.
     */
    static async checkAutoDisable(): Promise<void> {
        const isOn = await this.isEnabled();
        if (!isOn) return;

        // Проверяем TTL из Redis
        const redis = await getRedis();
        let expiresAtStr: string | null = null;

        if (redis) {
            try {
                expiresAtStr = await redis.get(REDIS_KEY_EXPIRES);
            } catch { /* ignore */ }
        }

        // Fallback: проверяем по DB AdminLog
        if (!expiresAtStr) {
            const lastEnable = await prisma.adminLog.findFirst({
                where: { action: 'SANDBOX_ENABLED' },
                orderBy: { createdAt: 'desc' }
            });

            if (lastEnable) {
                const meta = lastEnable.metadata as any;
                expiresAtStr = meta?.expiresAt || null;
            }
        }

        if (!expiresAtStr) return;

        const expiresAt = new Date(expiresAtStr);
        if (new Date() > expiresAt) {
            await this.disable('system-auto-disable', 'TTL expired');
            await this.notifyAutoDisable();
        }
    }

    /**
     * Определяет, должен ли запрос к провайдеру быть перехвачен.
     * НЕ перехватывает: action=services (синхронизация каталога) и [MOCK] провайдеров.
     */
    static shouldIntercept(providerName: string, action: string): boolean {
        // [MOCK] провайдеры уже и так смотрят на мок-сервер, не трогаем
        if (providerName.startsWith('[MOCK]')) return false;
        // Синхронизацию каталога НИКОГДА не перехватываем
        if (action === 'services') return false;
        // Все остальные действия (add, status, balance) — перехватываем
        return true;
    }

    /**
     * Добавляет метку isSandbox: true к metadata объекта.
     * Единый способ пометить запись как тестовую.
     */
    static tagRecord(existingMetadata: any): any {
        const meta = (typeof existingMetadata === 'object' && existingMetadata) ? { ...existingMetadata } : {};
        meta.isSandbox = true;
        meta.sandboxCreatedAt = new Date().toISOString();
        return meta;
    }

    /**
     * Проверяет, является ли запись тестовой (sandbox).
     */
    static isSandboxRecord(metadata: any): boolean {
        return metadata?.isSandbox === true;
    }

    /**
     * Удаляет все тестовые данные (Orders, Transactions, SupportTickets).
     * Используется кнопкой «Очистить тестовые данные» в Admin UI.
     */
    static async purgeTestData(adminId: string): Promise<{ orders: number; transactions: number; tickets: number }> {
        // Prisma не поддерживает JSON-фильтрацию в deleteMany — используем raw SQL
        const [ordersResult, transactionsResult, ticketsResult] = await prisma.$transaction([
            prisma.$executeRaw`DELETE FROM "Order" WHERE metadata->>'isSandbox' = 'true'`,
            prisma.$executeRaw`DELETE FROM "Transaction" WHERE metadata->>'isSandbox' = 'true'`,
            prisma.$executeRaw`DELETE FROM "SupportTicket" WHERE metadata->>'isSandbox' = 'true'`
        ]);

        await prisma.adminLog.create({
            data: {
                adminId,
                action: 'SANDBOX_PURGE',
                details: `Очистка тестовых данных. Удалено: Orders=${ordersResult}, Transactions=${transactionsResult}, Tickets=${ticketsResult}`,
                metadata: { orders: ordersResult, transactions: transactionsResult, tickets: ticketsResult }
            }
        });

        console.log(`[SandboxService] 🗑 Purged test data by ${adminId}: ${ordersResult} orders, ${transactionsResult} transactions, ${ticketsResult} tickets`);

        return { orders: ordersResult, transactions: transactionsResult, tickets: ticketsResult };
    }

    /**
     * Получает информацию о текущем состоянии Песочницы для UI.
     */
    static async getStatus(): Promise<{
        enabled: boolean;
        expiresAt: string | null;
        enabledBy: string | null;
    }> {
        const enabled = await this.isEnabled();
        let expiresAt: string | null = null;
        let enabledBy: string | null = null;

        if (enabled) {
            const redis = await getRedis();
            if (redis) {
                try {
                    expiresAt = await redis.get(REDIS_KEY_EXPIRES);
                    enabledBy = await redis.get(REDIS_KEY_ENABLED_BY);
                } catch { /* ignore */ }
            }

            // Fallback to DB
            if (!expiresAt) {
                const lastEnable = await prisma.adminLog.findFirst({
                    where: { action: 'SANDBOX_ENABLED' },
                    orderBy: { createdAt: 'desc' }
                });
                if (lastEnable) {
                    const meta = lastEnable.metadata as any;
                    expiresAt = meta?.expiresAt || null;
                    enabledBy = lastEnable.adminId;
                }
            }
        }

        return { enabled, expiresAt, enabledBy };
    }

    /**
     * Push-уведомление админу при автоматическом отключении.
     */
    private static async notifyAutoDisable() {
        try {
            const { BroadcastService } = await import('@/services/support/broadcast.service');
            await BroadcastService.notifyAdmin(
                `⚠️ <b>SANDBOX AUTO-DISABLE</b>\n` +
                `────────────────────\n` +
                `Режим Песочницы автоматически отключён по истечению таймера.\n\n` +
                `✅ Платёжная система переведена в PRODUCTION.\n` +
                `✅ Все провайдеры работают в боевом режиме.\n\n` +
                `<i>Если вы не заканчивали тестирование, включите Песочницу снова в Настройках.</i>`
            );
        } catch (e) {
            console.error('[SandboxService] Failed to send auto-disable notification:', e);
        }
    }
}
