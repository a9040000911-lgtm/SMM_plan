'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

async function getCtx(): Promise<AdminContext> {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');
  return {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };
}

export async function updateSettingsAction(formData: FormData): Promise<{ success: boolean; error?: string; requires2FA?: boolean }> {
  const ctx = await getCtx();
  if (!ctx.isGlobalAdmin) throw new Error('Unauthorized');

  const projectId = formData.get('projectId') as string;
  if (!projectId) throw new Error('Project ID missing');

  const rawEntries = Object.fromEntries(formData.entries());
  const verificationCode = formData.get('verificationCode') as string;

  // --- CRITICAL CHANGE DETECTION ---
  const criticalCheck = await AdminDataService.checkCriticalProjectChanges(ctx, projectId, rawEntries);
  if (!criticalCheck.success) throw new Error(criticalCheck.error.message);

  const { isCritical, criticalFields: _criticalFields } = criticalCheck.data;

  if (isCritical) {
    const verifiedResult = await AdminDataService.verify2FACode(ctx, ctx.userId, verificationCode);
    if (!verifiedResult.success || !verifiedResult.data) {
      await AdminDataService.generate2FACode(ctx, ctx.userId, 'SETTINGS');
      return { success: false, error: 'verification_required', requires2FA: true };
    }
    // Audit log is handled inside updateProjectSettingsFull
  }
  // ---------------------------------

  // Retrieve raw project to preserve data missing from form
  const rawProjectRes = await AdminDataService.getProjectRaw(ctx, projectId);
  if (!rawProjectRes.success) throw new Error('Project not found');
  const dbProject = rawProjectRes.data;

  const { CryptoService } = await import('@/services/core/crypto.service');
  const currentConfig: any = dbProject.config ? (CryptoService.decryptJson(dbProject.config as any) || {}) : {};
  const currentPayment: any = dbProject.paymentSettings ? (CryptoService.decryptJson(dbProject.paymentSettings as any) || {}) : {};

  // Construct structured data for service with Deep Merge
  const updateData = {
    project: {
       name: rawEntries['name'] !== undefined ? (rawEntries['name'] as string) : dbProject.name,
       domain: rawEntries['domain'] !== undefined ? (rawEntries['domain'] as string) : dbProject.domain,
       brandColor: rawEntries['brandColor'] !== undefined ? (rawEntries['brandColor'] as string) : dbProject.brandColor,
       botToken: rawEntries['botToken'] !== undefined ? ((rawEntries['botToken'] as string) || null) : dbProject.botToken,
       botUsername: rawEntries['botUsername'] !== undefined ? ((rawEntries['botUsername'] as string) || null) : dbProject.botUsername,
       
       paymentSettings: {
          provider: rawEntries['payment_provider'] !== undefined ? rawEntries['payment_provider'] : (currentPayment.provider || 'YOOKASSA'),
          mode: rawEntries['payment_mode'] !== undefined ? rawEntries['payment_mode'] : (currentPayment.mode || 'PRODUCTION'),
          yookassa: {
            useGlobal: formData.has('yookassa_shopId') ? formData.get('yookassa_useGlobal') === 'on' : currentPayment.yookassa?.useGlobal,
            shopId: rawEntries['yookassa_shopId'] !== undefined ? rawEntries['yookassa_shopId'] : currentPayment.yookassa?.shopId,
            secretKey: rawEntries['yookassa_secretKey'] !== undefined ? rawEntries['yookassa_secretKey'] : currentPayment.yookassa?.secretKey,
            testShopId: rawEntries['yookassa_testShopId'] !== undefined ? rawEntries['yookassa_testShopId'] : currentPayment.yookassa?.testShopId,
            testSecretKey: rawEntries['yookassa_testSecretKey'] !== undefined ? rawEntries['yookassa_testSecretKey'] : currentPayment.yookassa?.testSecretKey
          },
          robokassa: {
            useGlobal: formData.has('robokassa_merchantLogin') ? formData.get('robokassa_useGlobal') === 'on' : currentPayment.robokassa?.useGlobal,
            merchantLogin: rawEntries['robokassa_merchantLogin'] !== undefined ? rawEntries['robokassa_merchantLogin'] : currentPayment.robokassa?.merchantLogin,
            password1: rawEntries['robokassa_password1'] !== undefined ? rawEntries['robokassa_password1'] : currentPayment.robokassa?.password1,
            password2: rawEntries['robokassa_password2'] !== undefined ? rawEntries['robokassa_password2'] : currentPayment.robokassa?.password2,
            testPassword1: rawEntries['robokassa_testPassword1'] !== undefined ? rawEntries['robokassa_testPassword1'] : currentPayment.robokassa?.testPassword1,
            testPassword2: rawEntries['robokassa_testPassword2'] !== undefined ? rawEntries['robokassa_testPassword2'] : currentPayment.robokassa?.testPassword2
          }
       },
       config: {
          ...currentConfig, // Keep previous root-level config properties intact
          urls: {
            offer: rawEntries['legal_offer'] !== undefined ? rawEntries['legal_offer'] : currentConfig.urls?.offer,
            privacy: rawEntries['legal_privacy'] !== undefined ? rawEntries['legal_privacy'] : currentConfig.urls?.privacy,
            rules: rawEntries['legal_rules'] !== undefined ? rawEntries['legal_rules'] : currentConfig.urls?.rules
          },
          smtp: {
            host: rawEntries['smtp_host'] !== undefined ? rawEntries['smtp_host'] : currentConfig.smtp?.host,
            user: rawEntries['smtp_user'] !== undefined ? rawEntries['smtp_user'] : currentConfig.smtp?.user,
            pass: rawEntries['smtp_pass'] !== undefined ? rawEntries['smtp_pass'] : currentConfig.smtp?.pass
          },
          modules: {
            scheduledOrders: formData.has('module_scheduled_orders_present') ? formData.get('module_scheduled_orders') === 'on' : (formData.has('name') ? formData.get('module_scheduled_orders') === 'on' : currentConfig.modules?.scheduledOrders),
            smartHints: formData.has('name') ? formData.get('module_smart_hints') === 'on' : currentConfig.modules?.smartHints,
            trackingGraphs: formData.has('name') ? formData.get('module_tracking_graphs') === 'on' : currentConfig.modules?.trackingGraphs
          },
          growthSimulator: rawEntries['growth_simulator_config'] !== undefined ? (rawEntries['growth_simulator_config'] ? JSON.parse(rawEntries['growth_simulator_config'] as string) : undefined) : currentConfig.growthSimulator,
       }
    },
    settings: {
      'MIN_DEPOSIT_AMOUNT': rawEntries['MIN_DEPOSIT_AMOUNT'],
      'REFERRAL_PERCENT': rawEntries['REFERRAL_PERCENT'],
      'MIN_MARGIN_PERCENT': rawEntries['MIN_MARGIN_PERCENT'],
      'BOT_WELCOME_TEXT': rawEntries['BOT_WELCOME_TEXT'],
      'MAX_WARNINGS': rawEntries['MAX_WARNINGS'],
      'AUTO_BAN_HOURS': rawEntries['AUTO_BAN_HOURS'],
      'WEBAPP_URL': rawEntries['WEBAPP_URL']
    }
  };

  // Filter out undefined setting keys
  Object.keys(updateData.settings).forEach(k => {
    if (updateData.settings[k as keyof typeof updateData.settings] === undefined) {
      delete updateData.settings[k as keyof typeof updateData.settings];
    }
  });

  const result = await AdminDataService.updateProjectSettingsFull(ctx, projectId, updateData, isCritical);
  if (!result.success) return { success: false, error: result.error.message };

  revalidatePath('/admin/settings');
  return { success: true };
}


