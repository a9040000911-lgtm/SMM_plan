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

  const { isCritical, criticalFields } = criticalCheck.data;

  if (isCritical) {
    const verifiedResult = await AdminDataService.verify2FACode(ctx, ctx.userId, verificationCode);
    if (!verifiedResult.success || !verifiedResult.data) {
      await AdminDataService.generate2FACode(ctx, ctx.userId);
      return { success: false, error: 'verification_required', requires2FA: true };
    }
    // Audit log is handled inside updateProjectSettingsFull
  }
  // ---------------------------------

  // Construct structured data for service
  const updateData = {
    project: {
       name: rawEntries['name'] as string,
       domain: rawEntries['domain'] as string,
       brandColor: rawEntries['brandColor'] as string,
       botToken: (rawEntries['botToken'] as string) || null,
       botUsername: (rawEntries['botUsername'] as string) || null,
       // JSON fields transformation
       paymentSettings: {
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
       },
       config: {
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

  const result = await AdminDataService.updateProjectSettingsFull(ctx, projectId, updateData, isCritical);
  if (!result.success) return { success: false, error: result.error.message };

  revalidatePath('/admin/settings');
  return { success: true };
}
