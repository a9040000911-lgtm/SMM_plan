/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { send2FACodeEmail } from '@/services/mail.service';

/**
 * POST /api/auth/forgot-password
 * Генерирует 6-значный код и отправляет на email
 */
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { email: email.toLowerCase().trim() }
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ success: true });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordCode: code,
                resetPasswordExpires: expires
            }
        });

        await send2FACodeEmail(email, code);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Forgot Password Error]', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
