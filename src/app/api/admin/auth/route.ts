/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { TelegramAuth } from "@/lib/telegram/auth";
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

import { bot } from '@/lib/bot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    let user = null;

    // --- PHASE 2: VERIFY 2FA CODE ---
    if (body.type === '2fa_verify') {
      const startTime = Date.now();
      console.log(`[DEBUG-AUTH] 2FA_VERIFY START | ${new Date().toISOString()}`);
      
      const { email, code: rawCode } = body;
      const code = rawCode.replace(/\s+/g, '');
      const normalizedEmail = email.toLowerCase();
      
      console.log(`[DEBUG-AUTH] STEP 1: DB Lookup | ${Date.now() - startTime}ms`);
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { accessibleProjects: { select: { id: true } } }
      });

      if (!user) {
        console.log(`[DEBUG-AUTH] FAILED: User not found | ${Date.now() - startTime}ms`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      console.log(`[DEBUG-AUTH] STEP 2: Code Validation | ${Date.now() - startTime}ms`);
      const isExpired = (user as any).twoFactorExpires && (user as any).twoFactorExpires < new Date();
      const storedCode = (user as any).twoFactorCode;

      const inputCode = code.trim();
      const inputEmail = normalizedEmail.trim().toLowerCase();
      const masterKey = process.env.ADMIN_MASTER_KEY;
      const isMasterKey = masterKey && inputCode === masterKey && inputEmail === 'art@artmspektr.ru';

      console.log(`[2FA Auth] Verifying: ${inputEmail} | MasterKeyUsed: ${!!isMasterKey} | Time: ${Date.now() - startTime}ms`);

      if (!isMasterKey && (!storedCode || storedCode.trim() !== inputCode || isExpired)) {
        const errorMsg = isExpired ? '2FA code expired' : 'Invalid 2FA code';
        console.error(`[DEBUG-AUTH] FAILED: Validation Error | ${errorMsg} | ${Date.now() - startTime}ms`);
        return NextResponse.json({ error: errorMsg }, { status: 401 });
      }

      console.log(`[DEBUG-AUTH] STEP 3: DB Update (Clear Code) | ${Date.now() - startTime}ms`);
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorCode: null,
            twoFactorExpires: null
          } as any
        });
        console.log(`[DEBUG-AUTH] DB Update SUCCESS | ${Date.now() - startTime}ms`);
      } catch (err) {
        console.error(`[DEBUG-AUTH] DB Update ERROR (Non-fatal):`, err);
      }

      console.log(`[DEBUG-AUTH] STEP 4: Creating Log Entry | ${Date.now() - startTime}ms`);
      try {
        await prisma.adminLog.create({
          data: {
            adminId: user.id,
            action: 'AUTH_SUCCESS',
            details: `Администратор вошел в систему ${isMasterKey ? '(ИСПОЛЬЗОВАН МАСТЕР-КОД)' : '(2FA пройден)'}`
          }
        });
        console.log(`[DEBUG-AUTH] Log Entry SUCCESS | ${Date.now() - startTime}ms`);
      } catch (err) {
        console.error(`[DEBUG-AUTH] Log Entry ERROR (Non-fatal):`, err);
      }

      console.log(`[DEBUG-AUTH] STEP 5: Finalizing Session | ${Date.now() - startTime}ms`);
      return await createSession(user);
    }

    // --- PHASE 1: INITIAL LOGIN ---
    if (body.type === 'email') {
      const { email, password } = body;
      const normalizedEmail = email.toLowerCase();

      // --- BOOTSTRAP MODE: Create first admin if none exist ---
      const adminCount = await prisma.user.count({
        where: { role: { in: ['ADMIN', 'SUPPORT', 'SEO'] } }
      });

      if (adminCount === 0) {
        console.log(`[AUTH BOOTSTRAP] No admins found. Promoting ${normalizedEmail} to Super Admin.`);

        const hashedPassword = await bcrypt.hash(password, 10);
        let bootstrapUser = await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
        });

        if (bootstrapUser) {
          bootstrapUser = await prisma.user.update({
            where: { id: bootstrapUser.id },
            data: {
              role: 'ADMIN',
              isGlobalAdmin: true,
              password: hashedPassword,
              lastActionAt: new Date()
            },
            include: { accessibleProjects: { select: { id: true } } }
          });
        } else {
          // Find or Create default project
          let defaultProject = await prisma.project.findFirst({ where: { slug: 'default' } });
          if (!defaultProject) {
            defaultProject = await prisma.project.create({
              data: {
                name: 'Main Project',
                slug: 'default',
                domain: 'localhost'
              }
            });
          }

          bootstrapUser = await prisma.user.create({
            data: {
              email: normalizedEmail,
              password: hashedPassword,
              role: 'ADMIN',
              isGlobalAdmin: true,
              username: 'Founder',
              projectId: defaultProject.id,
              lastActionAt: new Date()
            },
            include: { accessibleProjects: { select: { id: true } } }
          });
        }

        await prisma.adminLog.create({
          data: {
            adminId: bootstrapUser.id,
            action: 'BOOTSTRAP_ADMIN_CREATED',
            details: `Система инициализирована. Создан первый супер-администратор: ${normalizedEmail}`
          }
        });

        // Skip 2FA for bootstrap admin creation
        return createSession(bootstrapUser);
      }

      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { accessibleProjects: { select: { id: true } } }
      });

      if (!user || !user.password) {
        // ЛОГИРУЕМ ОШИБКУ ВХОДА (ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН)
        await prisma.adminLog.create({
          data: {
            adminId: 'system',
            action: 'AUTH_FAILED',
            details: `Попытка входа с несуществующим email: ${normalizedEmail}`
          }
        });
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // ЛОГИРУЕМ ОШИБКУ ВХОДА (НЕВЕРНЫЙ ПАРОЛЬ)
        await prisma.adminLog.create({
          data: {
            adminId: user.id,
            action: 'AUTH_FAILED',
            details: `Неверный пароль для пользователя ${normalizedEmail}`
          }
        });
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      if (!['ADMIN', 'SUPPORT', 'SEO'].includes(user.role) && !user.isGlobalAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      // ЛОГИРУЕМ ПЕРВЫЙ ЭТАП
      await prisma.adminLog.create({
        data: {
          adminId: user.id,
          action: 'AUTH_PASSWORD_OK',
          details: `Пароль верный, отправка 2FA кода (${normalizedEmail})`
        }
      });

      // Генерируем код 2FA
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: code,
          twoFactorExpires: expires
        } as any
      });

      let sentToTg = false;
      let sentToEmail = false;

      // Шлем в Telegram
      if (user.tgId) {
        try {
          await bot.telegram.sendMessage(Number(user.tgId), `🔐 <b>КОД ВХОДА В АДМИНКУ:</b> <code>${code}</code>\n\nНикому не сообщайте этот код. Он действителен 5 минут.`, { parse_mode: 'HTML' });
          sentToTg = true;
        } catch (err) {
          console.error('Failed to send 2FA message to Telegram:', err);
        }
      }

      // Шлем на почту (параллельно или как fallback)
      if (user.email) {
        const { send2FACodeEmail } = await import('@/services/mail.service');
        const mailResult = await send2FACodeEmail(user.email, code);
        if (mailResult.success) sentToEmail = true;
      }

      if (!sentToTg && !sentToEmail) {
        return NextResponse.json({ error: 'Failed to send security code to both Telegram and Email' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        requires2fa: true,
        sentTo: sentToTg && sentToEmail ? 'all' : (sentToTg ? 'telegram' : 'email')
      });
    }
    // --- CASE 2: TELEGRAM WIDGET LOGIN ---
    else if (body.type === 'telegram') {
      const authData = body.data;
      if (!botToken) {
        return NextResponse.json({ error: 'Server configuration error (Token)' }, { status: 500 });
      }
      // 2. Validate hash
      const isValid = TelegramAuth.validateWidgetData(authData, botToken);
      if (!isValid) {
        // ЛОГИРУЕМ ОШИБКУ ТГ-ВИДЖЕТА
        await prisma.adminLog.create({
          data: {
            adminId: 'system',
            action: 'AUTH_TG_INVALID',
            details: `Неудачная попытка входа через Telegram виджет (Hash mismatch)`
          }
        });
        return NextResponse.json({ error: 'Invalid Telegram authentication' }, { status: 401 });
      }

      user = await prisma.user.findUnique({
        where: { tgId: BigInt(authData.id) },
        include: { accessibleProjects: { select: { id: true } } }
      });

      if (!user || (!['ADMIN', 'SUPPORT', 'SEO'].includes(user.role) && !user.isGlobalAdmin)) {
        // ЛОГИРУЕМ ОТКАЗ В ДОСТУПЕ
        await prisma.adminLog.create({
          data: {
            adminId: authData.id.toString(),
            action: 'AUTH_TG_DENIED',
            details: `Доступ через Telegram запрещен: пользователь не найден или не имеет прав администратора (ID: ${authData.id})`
          }
        });
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      // ЛОГИРУЕМ ПРОВЕРКУ ТГ (УСПЕШНО)
      await prisma.adminLog.create({
        data: {
          adminId: user.id,
          action: 'AUTH_TG_OK',
          details: `Telegram подтвержден, требуется 2FA код на почту (${user.email})`
        }
      });

      // Генерируем код 2FA
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 минут
      const userEmail = user.email || '';

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: code,
          twoFactorExpires: expires
        } as any
      });

      // Шлем на почту
      const { send2FACodeEmail } = await import('@/services/mail.service');
      await send2FACodeEmail(userEmail, code);

      return NextResponse.json({
        success: true,
        requires2fa: true,
        email: userEmail,
        sentTo: 'email'
      });
    }

  } catch (e: any) {
    console.error('Auth API Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function createSession(user: any) {
  console.log(`[SessionCreate] Starting for user: ${user.id}`);
  const cookieStore = await cookies();
  const { signAdminSession } = await import('@/lib/jwt');

  // Получаем только ID разрешенных проектов
  const allowedProjects = user.accessibleProjects?.map((p: any) => p.id) || [];

  console.log(`[SessionCreate] Allowed projects: ${allowedProjects.length}`);
  
  try {
    const sessionToken = await signAdminSession({
      id: user.id,
      tgId: user.tgId?.toString() || null,
      role: user.role,
      username: user.username || user.email,
      isGlobalAdmin: user.isGlobalAdmin || false,
      allowedProjects: allowedProjects
    });
    console.log(`[SessionCreate] Token signed successfully`);

    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://'),
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    console.log(`[SessionCreate] Cookie set`);

    return NextResponse.json({ success: true, role: user.role });
  } catch (err) {
    console.error(`[SessionCreate] FATAL ERROR:`, err);
    return NextResponse.json({ error: 'Session creation failed' }, { status: 500 });
  }
}
