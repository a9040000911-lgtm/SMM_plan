/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from '@/services/mail.service';
import { bot } from '@/services/bot/bot-registry';

export async function POST(req: NextRequest) {
  try {
    const { action, email, code, newPassword } = await req.json();
    const normalizedEmail = email?.toLowerCase();

    // 1. ЗАПРОС КОДА
    if (action === 'request') {
      console.log(`[AuthDebug] Requesting reset code for: "${normalizedEmail}"`);
      const user = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          OR: [
            { role: { in: ['ADMIN', 'SUPPORT', 'SEO'] } },
            { isGlobalAdmin: true }
          ]
        }
      });

      if (!user) {
        console.warn(`[AuthDebug] User not found or not staff: "${normalizedEmail}"`);
        return NextResponse.json({ error: 'Сотрудник с такой почтой не найден' }, { status: 404 });
      }
      console.log(`[AuthDebug] User found: ${user.id} (Role: ${user.role})`);

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      await redis.set(`password_reset_${normalizedEmail}`, resetCode, 'EX', 600); // 10 минут

      // 1. Шлем на почту
      await sendPasswordResetEmail(normalizedEmail, resetCode);

      // 2. Шлем в Telegram (если привязан)
      if (user.tgId) {
        try {
          await bot.telegram.sendMessage(
            Number(user.tgId),
            `🔄 <b>СБРОС ПАРОЛЯ</b>\n\nВаш код для установки нового пароля: <code>${resetCode}</code>\n\nЕсли это не вы, срочно проверьте настройки безопасности.`,
            { parse_mode: 'HTML' }
          );
        } catch (tgError) {
          console.error('Failed to send reset code to Telegram:', tgError);
        }
      }

      return NextResponse.json({ success: true, message: 'Код сброса отправлен на вашу почту и в Telegram' });
    }

    // 2. СБРОС ПАРОЛЯ
    if (action === 'reset') {
      const storedCode = await redis.get(`password_reset_${normalizedEmail}`);

      if (!storedCode || storedCode !== code) {
        return NextResponse.json({ error: 'Неверный или истекший код' }, { status: 401 });
      }

      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: 'Пароль должен быть не менее 8 символов' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const userToUpdate = await prisma.user.findFirst({ where: { email: normalizedEmail } });
      if (!userToUpdate) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

      await prisma.user.update({
        where: { id: userToUpdate.id },
        data: { password: hashedPassword }
      });

      // ЛОГИРУЕМ ДЕЙСТВИЕ
      await prisma.adminLog.create({
        data: {
          adminId: userToUpdate.id,
          action: 'PASSWORD_RESET',
          details: `Пароль пользователя ${normalizedEmail} был успешно сброшен через форму восстановления.`,
        }
      });

      await redis.del(`password_reset_${normalizedEmail}`);

      return NextResponse.json({ success: true, message: 'Пароль успешно изменен' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}


