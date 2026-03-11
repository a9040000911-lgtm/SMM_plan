'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { TwoFactorService } from '@/services/admin/two-factor.service';

export async function updateSettingsAction(formData: FormData): Promise<{ success: boolean; error?: string; requires2FA?: boolean }> {
  const session = await getAdminSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');

  const projectId = formData.get('projectId') as string;
  if (!projectId) throw new Error('Project ID missing');

  const rawEntries = Object.fromEntries(formData.entries());
  const verificationCode = formData.get('verificationCode') as string;

  // --- CRITICAL CHANGE DETECTION ---
  let isCritical = false;
  const criticalFields: string[] = [];

  const currentProject = await prisma.project.findUnique({ where: { id: projectId } });
  if (!currentProject) throw new Error('Project not found');

  // Check Bot Token
  const newBotToken = (rawEntries['botToken'] as string) || null;
  if (currentProject.botToken !== newBotToken) {
    isCritical = true;
    criticalFields.push('Bot Token');
  }

  // Check Payment Provider
  const currentPayment = (currentProject.paymentSettings as any) || {};
  if (currentPayment.provider !== rawEntries['payment_provider']) {
    isCritical = true;
    criticalFields.push('Payment Provider');
  }

  // Check YooKassa Keys
  const yookassa = currentPayment.yookassa || {};
  if ((rawEntries['yookassa_shopId'] || '') !== (yookassa.shopId || '')) { isCritical = true; criticalFields.push('YooKassa ShopID'); }
  if ((rawEntries['yookassa_secretKey'] || '') !== (yookassa.secretKey || '')) { isCritical = true; criticalFields.push('YooKassa SecretKey'); }

  // Check Robokassa Keys
  const robokassa = currentPayment.robokassa || {};
  if ((rawEntries['robokassa_merchantLogin'] || '') !== (robokassa.merchantLogin || '')) { isCritical = true; criticalFields.push('Robokassa Login'); }
  if ((rawEntries['robokassa_password1'] || '') !== (robokassa.password1 || '')) { isCritical = true; criticalFields.push('Robokassa Pass1'); }

  // Check Global Settings (Financial)
  const financialKeys = ['MIN_MARGIN_PERCENT', 'REFERRAL_PERCENT', 'MIN_DEPOSIT_AMOUNT'];
  const currentSettings = await prisma.settings.findMany({
    where: { projectId, key: { in: financialKeys } }
  });

  for (const key of financialKeys) {
    const current = currentSettings.find(s => s.key === key)?.value;
    const proposed = rawEntries[key] as string;
    // If setting exists and changed, or doesn't exist and set (unless default matching logic exists, assume strict change)
    // Since defaults vary, any mismatch is critical if key is sensitive.
    if (current !== proposed && proposed !== undefined) {
      isCritical = true;
      criticalFields.push(key);
    }
  }

  if (isCritical) {
    const verified = verificationCode ? await TwoFactorService.verifyCode(session.id, verificationCode) : false;
    if (!verified) {
      await TwoFactorService.sendCode(session.id);
      return { success: false, error: 'verification_required', requires2FA: true };
    }

    // Log critical change details securely (mask secrets?)
    // We log merely that critical fields changed.
    await prisma.adminLog.create({
      data: {
        adminId: session.id,
        action: 'UPDATE_CRITICAL_SETTINGS',
        details: `Project ${projectId} critical update: ${criticalFields.join(', ')} (2FA Verified)`
      }
    });
  }
  // ---------------------------------


  // 1. UPDATE PROJECT DIRECT FIELDS
  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: rawEntries['name'] as string,
      domain: rawEntries['domain'] as string,
      brandColor: rawEntries['brandColor'] as string,
      botToken: (rawEntries['botToken'] as string) || null,
      botUsername: (rawEntries['botUsername'] as string) || null,
    }
  });

  // 2. UPDATE PROJECT JSON CONFIGS
  const paymentConfig = (currentProject?.paymentSettings as any) || {};
  const currentConfig = (currentProject?.config as any) || {};

  // Update Payment Config with structured format
  const newPaymentConfig = {
    ...paymentConfig,
    provider: rawEntries['payment_provider'] || 'YOOKASSA',
    mode: rawEntries['payment_mode'] || 'PRODUCTION',
    yookassa: {
      shopId: rawEntries['yookassa_shopId'] || '',
      secretKey: rawEntries['yookassa_secretKey'] || '',
      testShopId: rawEntries['yookassa_testShopId'] || '',
      testSecretKey: rawEntries['yookassa_testSecretKey'] || ''
    },
    robokassa: {
      merchantLogin: rawEntries['robokassa_merchantLogin'] || '',
      password1: rawEntries['robokassa_password1'] || '',
      password2: rawEntries['robokassa_password2'] || '',
      testPassword1: rawEntries['robokassa_testPassword1'] || '',
      testPassword2: rawEntries['robokassa_testPassword2'] || ''
    }
  };

  // Update General Config (URLs, etc)
  const newConfig = {
    ...currentConfig,
    urls: {
      offer: rawEntries['legal_offer'],
      privacy: rawEntries['legal_privacy'],
      rules: rawEntries['legal_rules']
    },
    smtp: {
      host: rawEntries['smtp_host'],
      user: rawEntries['smtp_user'],
      pass: rawEntries['smtp_pass']
    },
    modules: {
      scheduledOrders: formData.get('module_scheduled_orders') === 'on',
      smartHints: formData.get('module_smart_hints') === 'on',
      trackingGraphs: formData.get('module_tracking_graphs') === 'on'
    }
  };

  await prisma.project.update({
    where: { id: projectId },
    data: {
      paymentSettings: newPaymentConfig,
      config: newConfig
    }
  });

  // 3. UPDATE SETTINGS TABLE
  const settingKeys = [
    'MIN_DEPOSIT_AMOUNT',
    'REFERRAL_PERCENT',
    'MIN_MARGIN_PERCENT',
    'BOT_WELCOME_TEXT',
    'MAX_WARNINGS',
    'AUTO_BAN_HOURS',
    'WEBAPP_URL'
  ];

  const updatePromises = settingKeys.map(key => {
    const value = rawEntries[key];
    if (value !== undefined) {
      return prisma.settings.upsert({
        where: { projectId_key: { projectId, key } },
        update: { value: String(value) },
        create: { projectId, key, value: String(value) },
      });
    }
  });

  await Promise.all(updatePromises);

  if (!isCritical) {
    await prisma.adminLog.create({
      data: {
        adminId: session.id,
        action: 'UPDATE_SETTINGS',
        details: `Project ${projectId} settings updated`
      }
    });
  }

  revalidatePath('/admin/settings');
  return { success: true };
}
