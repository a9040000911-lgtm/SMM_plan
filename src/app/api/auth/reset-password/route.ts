/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * POST /api/auth/reset-password
 * Проверяет код и устанавливает новый пароль (пользовательский или автогенерированный)
 */
export async function POST(req: NextRequest) {
    try {
        const { email, code, mode, newPassword } = await req.json();

        if (!email || !code || !mode) {
            return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
        }

        if (mode === 'custom' && (!newPassword || newPassword.length < 6)) {
            return NextResponse.json({ error: 'Пароль должен содержать минимум 6 символов' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { email: email.toLowerCase().trim() }
        });

        if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
            return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
        }

        if (user.resetPasswordCode !== code) {
            return NextResponse.json({ error: 'Неверный код подтверждения' }, { status: 400 });
        }

        if (new Date() > user.resetPasswordExpires) {
            return NextResponse.json({ error: 'Код истёк. Запросите новый' }, { status: 400 });
        }

        // Generate or use provided password
        let finalPassword: string;
        if (mode === 'auto') {
            finalPassword = crypto.randomBytes(4).toString('hex'); // 8-char random
        } else {
            finalPassword = newPassword;
        }

        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordCode: null,
                resetPasswordExpires: null,
            }
        });

        return NextResponse.json({
            success: true,
            generatedPassword: mode === 'auto' ? finalPassword : undefined
        });
    } catch (error: any) {
        console.error('[Reset Password Error]', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}


