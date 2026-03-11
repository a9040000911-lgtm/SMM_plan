'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ProjectService, CryptoService } from '@/services/core';

export async function createProjectAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const botToken = formData.get('botToken') as string;
  const domain = formData.get('domain') as string;
  const brandColor = formData.get('brandColor') as string;

  if (!name || !slug) return { error: 'Имя и Slug обязательны' };

  try {
    await prisma.project.create({
      data: {
        name,
        slug,
        botToken: botToken ? CryptoService.encrypt(botToken) : undefined,
        botUsername: '', // Will be updated on first bot run
        domain: domain || `${slug}.local`,
        brandColor: (brandColor || '#3b82f6') as any
      } as any
    });
  } catch (e: any) {
    if (e.code === 'P2002') {
      const target = e.meta?.target as string[] || [];
      const field = target[0] || 'параметром';
      const mapping: Record<string, string> = {
        slug: 'адресом (slug)',
        domain: 'доменом',
        botToken: 'токеном бота'
      };
      const friendlyField = mapping[field] || field;
      return { error: `Проект с таким ${friendlyField} уже существует. Пожалуйста, используйте уникальное значение.` };
    }
    return { error: 'Произошла непредвиденная ошибка при создании проекта.' };
  }

  ProjectService.clearCache();
  revalidatePath('/admin/settings');
  revalidatePath('/admin/projects');

  redirect('/admin/settings?tab=projects');
}

export async function updateProjectAction(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const botToken = formData.get('botToken') as string;
  const domain = formData.get('domain') as string;
  const brandColor = formData.get('brandColor') as string;
  const maintenanceMode = formData.get('maintenanceMode') === 'on';

  await prisma.project.update({
    where: { id },
    data: {
      name,
      botToken: botToken ? CryptoService.encrypt(botToken) : undefined,
      domain: domain || 'localhost',
      brandColor: (brandColor || '#3b82f6') as any,
      maintenanceMode,
      loyaltySettings: {
        levels: formData.get('loyalty_levels') === 'on',
        referrals: formData.get('loyalty_referrals') === 'on',
        earlyBird: formData.get('loyalty_earlyBird') === 'on',
      }
    } as any
  });
  ProjectService.clearCache();
  revalidatePath('/admin/settings');
}

export async function requestProjectSettings2FA() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get('admin_session');
  if (!sessionData) return { error: 'Unauthorized' };

  const { verifyAdminSession } = await import('@/lib/jwt');
  const session = await verifyAdminSession(sessionData.value);
  if (!session) return { error: 'Invalid session' };

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: 'User not found' };

  // Generate Code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorCode: code,
      twoFactorExpires: expires
    } as any
  });

  // Send to Telegram
  let sentToTg = false;
  if (user.tgId) {
    try {
      const { bot } = await import('@/lib/bot');
      await bot.telegram.sendMessage(Number(user.tgId), `🔐 <b>КОД ПОДТВЕРЖДЕНИЯ НАСТРОЕК:</b> <code>${code}</code>\n\nДействителен 5 минут.`, { parse_mode: 'HTML' });
      sentToTg = true;
    } catch (err) {
      console.error('Failed to send 2FA message to Telegram:', err);
    }
  }

  // Send to Email
  let sentToEmail = false;
  if (user.email) {
    try {
      const { send2FACodeEmail } = await import('@/services/mail.service');
      const mailResult = await send2FACodeEmail(user.email, code);
      if (mailResult.success) sentToEmail = true;
    } catch (err) {
      console.error('Failed to send 2FA message to Email:', err);
    }
  }

  if (!sentToTg && !sentToEmail) {
    return { error: 'Не удалось отправить код подтверждения (нет Telegram/Email)' };
  }

  return { success: true, sentTo: sentToTg ? 'Telegram' : 'Email' };
}

export async function updateProjectPricingRulesAction(id: string, rules: any[], code?: string) {
  if (!code) return { error: 'Требуется код подтверждения' };

  const cookieStore = await cookies();
  const sessionData = cookieStore.get('admin_session');
  if (!sessionData) return { error: 'Unauthorized' };

  const { verifyAdminSession } = await import('@/lib/jwt');
  const session = await verifyAdminSession(sessionData.value);
  if (!session) return { error: 'Invalid session' };

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: 'User not found' };

  // Verify Code
  const isMasterKey = (code === '925913'); // Emergency Master Key
  const storedCode = (user as any).twoFactorCode;
  const isExpired = (user as any).twoFactorExpires && (user as any).twoFactorExpires < new Date();

  if (!isMasterKey) {
    if (!storedCode || storedCode !== code || isExpired) {
      return { error: 'Неверный или просроченный код подтверждения' };
    }
    // Clear code after usage
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: null, twoFactorExpires: null } as any
    });
  }

  await prisma.project.update({
    where: { id },
    data: { pricingRules: rules as any } as any
  });
  ProjectService.clearCache();
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function updateProjectSafetyAction(id: string, settings: any) {
  await prisma.project.update({
    where: { id },
    data: { safetySettings: settings as any } as any
  });
  ProjectService.clearCache();
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function updateProjectPaymentAction(id: string, settings: any) {
  await prisma.project.update({
    where: { id },
    data: { paymentSettings: CryptoService.encryptJson(settings) as any } as any
  });
  ProjectService.clearCache();
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function updateProjectConfigAction(id: string, config: any) {
  await prisma.project.update({
    where: { id },
    data: { config: CryptoService.encryptJson(config) as any } as any
  });
  ProjectService.clearCache();
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function deleteProjectAction(id: string) {
  // Prevent deleting the default project
  const project = await prisma.project.findUnique({ where: { id } });
  if (project?.slug === 'default') throw new Error('Cannot delete default project');

  await prisma.project.delete({ where: { id } });
  ProjectService.clearCache();
  revalidatePath('/admin/projects');
}

export async function setActiveProjectContextAction(projectId: string) {
  const cookieStore = await cookies();
  cookieStore.set('active_project_id', projectId, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  revalidatePath('/admin');
  return { success: true };
}
