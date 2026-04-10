/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/verify-2fa
 * Проверяет 2FA код и возвращает результат
 */
export async function POST(req: NextRequest) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { email: email.toLowerCase().trim() }
        });

        if (!user || !user.twoFactorCode || !user.twoFactorExpires) {
            return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
        }

        if (user.twoFactorCode !== code) {
            return NextResponse.json({ error: 'Неверный код подтверждения' }, { status: 400 });
        }

        if (new Date() > user.twoFactorExpires) {
            return NextResponse.json({ error: 'Код истёк. Попробуйте войти снова' }, { status: 400 });
        }

        // Clear 2FA code
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorCode: null,
                twoFactorExpires: null
            }
        });

        return NextResponse.json({ success: true, verified: true });
    } catch (error: any) {
        console.error('[Verify 2FA Error]', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}


