/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { redis } from '@/lib/redis';
import { bot } from '@/lib/bot';
import { prisma } from '@/lib/prisma';

export class TwoFactorService {
    /**
     * Sends a 2FA verification code to the admin's Telegram
     */
    static async sendCode(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.tgId) {
            console.warn(`[2FA] User ${userId} has no telegram linked. Code not sent.`);
            return false;
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in Redis (5 min TTL)
        const key = `2fa:${userId}`;
        await redis.set(key, code, 'EX', 300);

        // Send via Telegram
        try {
            const msg = `🔐 <b>Код подтверждения:</b> <code>${code}</code>\n\n` +
                `Используйте этот код для подтверждения изменения настроек.\n` +
                `<i>Код действителен 5 минут.</i>`;

            await bot.telegram.sendMessage(Number(user.tgId), msg, { parse_mode: 'HTML' });
            return true;
        } catch (e) {
            console.error('[2FA] Failed to send code:', e);
            return false;
        }
    }

    /**
     * Verifies the code. Returns true if valid.
     * Consumes user code if valid (one-time use).
     */
    static async verifyCode(userId: string, code: string): Promise<boolean> {
        if (!code) return false;
        const key = `2fa:${userId}`;
        const stored = await redis.get(key);

        if (stored && stored === code.trim()) {
            await redis.del(key);
            return true;
        }
        return false;
    }
}
