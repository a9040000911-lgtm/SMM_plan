/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { sendOrderAccessCodeEmail } from '@/services/mail.service';
import { signMagicToken } from './magic-auth';

export class CheckoutAuthService {
    /**
     * Генерирует 6-значный код, сохраняет его в БД и отправляет на почту.
     */
    static async sendVerificationCode(email: string, projectId: string) {
        const user = await prisma.user.findFirst({
            where: { email: email.toLowerCase(), projectId }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Генерируем 6-значный цифровой код
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorCode: code,
                twoFactorExpires: expires
            }
        });

        await sendOrderAccessCodeEmail(email, code);

        return { success: true };
    }

    /**
     * Проверяет код и возвращает Magic Token для авторизации через Credentials Provider.
     */
    static async verifyCode(email: string, code: string, projectId: string) {
        const user = await prisma.user.findFirst({
            where: { email: email.toLowerCase(), projectId }
        });

        if (!user || !user.twoFactorCode || !user.twoFactorExpires) {
            return { success: false, error: 'Invalid request' };
        }

        if (user.twoFactorCode !== code) {
            return { success: false, error: 'Неверный код подтверждения' };
        }

        if (new Date() > user.twoFactorExpires) {
            return { success: false, error: 'Срок действия кода истек' };
        }

        // Очищаем код после успешной проверки
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorCode: null,
                twoFactorExpires: null
            }
        });

        // Создаем Magic Token для входа
        const token = await signMagicToken({
            userId: user.id,
            tgId: user.tgId ? user.tgId.toString() : '',
            projectId: projectId
        });

        return { success: true, token };
    }

    /**
     * Создает Magic Token для пользователя БЕЗ проверки кода (только для Zero-Balance).
     */
    static async getMagicToken(user: { id: string, tgId: any }, projectId: string) {
        return await signMagicToken({
            userId: user.id,
            tgId: user.tgId ? user.tgId.toString() : '',
            projectId: projectId
        });
    }
}
