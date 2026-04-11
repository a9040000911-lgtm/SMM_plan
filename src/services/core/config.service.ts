import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { CryptoService } from '@/services/core/crypto.service';

export class ConfigService {

    /**
     * Retrieves Payment Configuration (YooKassa etc.)
     * Priority: Project DB Settings > Env Vars
     */
    static async getPaymentConfig(projectId?: string, tx?: Prisma.TransactionClient) {
        let dbConfig: any = {};
        const db = tx || prisma;

        if (projectId) {
            const project = await db.project.findUnique({
                where: { id: projectId },
                select: { paymentSettings: true }
            });
            // Decrypt JSON settings if present
            const encryptedSettings = project?.paymentSettings as string;
            dbConfig = CryptoService.decryptJson(encryptedSettings) || {};
        }

        // Determine Mode
        const mode = dbConfig.mode || process.env.PAYMENT_MODE || 'LIVE';

        // Select Credentials based on Mode
        if (mode === 'TEST') {
            return {
                shopId: dbConfig.testShopId || process.env.YOOKASSA_TEST_SHOP_ID,
                secretKey: dbConfig.testSecretKey || process.env.YOOKASSA_TEST_SECRET_KEY,
                mode: 'TEST'
            };
        }

        return {
            shopId: dbConfig.shopId || process.env.YOOKASSA_SHOP_ID,
            secretKey: dbConfig.secretKey || process.env.YOOKASSA_SECRET_KEY,
            mode: 'LIVE'
        };
    }

    /**
     * Retrieves Telegram Bot Configuration
     * Priority: Project DB Settings > Env Vars
     */
    static async getTelegramConfig(projectId?: string, tx?: Prisma.TransactionClient) {
        // If we have a project ID, we try to get the specific bot token for that project
        // Multi-tenancy support for the future
        let token = process.env.TELEGRAM_BOT_TOKEN;
        let username = process.env.BOT_USERNAME || 'smmplan_bot';
        const adminId = process.env.ADMIN_TG_ID;
        const db = tx || prisma;

        if (projectId) {
            const project = await db.project.findUnique({
                where: { id: projectId },
                select: { botToken: true, botUsername: true, config: true }
            });
            if (project) {
                if (project.botToken) token = CryptoService.decrypt(project.botToken as string);
                if (project.botUsername) username = project.botUsername;
                // Admin ID might be stored in project config in future
            }
        }

        return {
            token,
            username,
            adminId
        };
    }

    /**
     * Retrieves SMTP/Mail Configuration
     * Priority: Project DB Settings > Global DB Settings > Env Vars
     */
    static async getSmtpConfig(projectId?: string, tx?: Prisma.TransactionClient) {
        const db = tx || prisma;
        const settings = await db.globalSetting.findMany({
            where: {
                key: { in: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'] }
            }
        });

        const map: Record<string, string> = {};
        settings.forEach((s: any) => map[s.key] = s.value);

        // Decrypt password if it exists
        let dbPassword = map.SMTP_PASSWORD;
        if (dbPassword) {
            dbPassword = CryptoService.decrypt(dbPassword);
        }

        return {
            host: map.SMTP_HOST || process.env.SMTP_HOST || 'smtp.yandex.ru',
            port: parseInt(map.SMTP_PORT || process.env.SMTP_PORT || '465', 10),
            user: map.SMTP_USER || process.env.SMTP_USER,
            password: dbPassword || process.env.SMTP_PASSWORD,
            from: map.SMTP_USER || process.env.SMTP_USER // Default sender
        };
    }

    /**
     * Updates Global SMTP Configuration securely
     */
    static async setSmtpConfig(config: { host: string; port: number; user: string; password?: string }) {
        const updates: Prisma.PrismaPromise<any>[] = [
            prisma.globalSetting.upsert({
                where: { key: 'SMTP_HOST' },
                update: { value: config.host },
                create: { key: 'SMTP_HOST', value: config.host }
            }),
            prisma.globalSetting.upsert({
                where: { key: 'SMTP_PORT' },
                update: { value: config.port.toString() },
                create: { key: 'SMTP_PORT', value: config.port.toString() }
            }),
            prisma.globalSetting.upsert({
                where: { key: 'SMTP_USER' },
                update: { value: config.user },
                create: { key: 'SMTP_USER', value: config.user }
            })
        ];

        // Only update password if provided
        if (config.password) {
            const encryptedPassword = CryptoService.encrypt(config.password);
            updates.push(
                prisma.globalSetting.upsert({
                    where: { key: 'SMTP_PASSWORD' },
                    update: { value: encryptedPassword },
                    create: { key: 'SMTP_PASSWORD', value: encryptedPassword }
                })
            );
        }

        await prisma.$transaction(updates);
    }

    /**
     * Retrieves AI (Gemini) Configuration
     */
    static async getAiConfig(tx?: Prisma.TransactionClient) {
        // Fetch from GlobalSetting table
        const db = tx || prisma;
        const settings = await db.globalSetting.findMany({
            where: {
                key: { in: ['AI_SELECTED_MODEL', 'AI_MODEL_LIST', 'AI_PROXY'] }
            }
        });

        const map: Record<string, string> = {};
        settings.forEach(s => map[s.key] = s.value);

        return {
            model: map.AI_SELECTED_MODEL || 'gemini-3-flash-preview',
            modelList: map.AI_MODEL_LIST || 'gemini-3-flash-preview, gemini-3-flash',
            proxy: map.AI_PROXY || process.env.AI_PROXY || null,
            apiKey: process.env.GEMINI_API_KEY
        };
    }

    /**
     * Retrieves General System Configuration
     */
    static getSystemConfig() {
        return {
            isDev: process.env.NODE_ENV === 'development',
            appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.WEBAPP_URL || 'https://smmplan.ru',
            webhookPort: parseInt(process.env.WEBHOOK_PORT || '3000'),
            redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
            defaultBotToken: process.env.TELEGRAM_BOT_TOKEN
        };
    }
}


