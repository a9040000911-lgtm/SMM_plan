'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession, getActiveProjectId } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';
import { PredictionService } from '@/services/users';
import { FinancialSecurityService } from '@/services/security/financial-security.service';
import { ProviderPaymentType } from '@/generated/client';

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

export async function getProvidersAction() {
  const ctx = await getCtx();
  const activeProjectId = await getActiveProjectId();
  const result = await AdminDataService.getProvidersWithStats(ctx, activeProjectId || undefined);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

export async function getActiveProjectContext() {
  const ctx = await getCtx();
  const activeProjectId = await getActiveProjectId();
  return { activeProjectId };
}

export async function syncAllProvidersAction() {
  const ctx = await getCtx();
  const activeProjectId = await getActiveProjectId();
  try {
    const result = await AdminDataService.getProvidersWithStats(ctx, activeProjectId || undefined);
    if (!result.success) throw new Error(result.error.message);

    const { ServiceSyncService } = await import('@/services/providers/sync.service');
    for (const p of result.data) {
      if (p.isEnabled) {
        await ServiceSyncService.syncProvider(p.id);
      }
    }

    const { BalanceMonitorService } = await import('@/services/providers/balance-monitor.service');
    await BalanceMonitorService.checkAndLogAllBalances();

    revalidatePath('/admin/providers');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function syncProviderAction(id: string) {
  await getCtx();
  try {
    const { ServiceSyncService } = await import('@/services/providers/sync.service');
    await ServiceSyncService.syncProvider(id);
    revalidatePath('/admin/providers');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getFinancialStatsAction() {
  await getCtx();
  const [forecasts, revenue] = await Promise.all([
    PredictionService.getProviderForecasts(),
    PredictionService.getRevenueForecast()
  ]);
  return { forecasts, revenue };
}

export async function createProviderAction(data: any) {
  const ctx = await getCtx();
  const activeProjectId = await getActiveProjectId();
  
  if (!data.projectId && activeProjectId && activeProjectId !== 'all') {
    data.projectId = activeProjectId;
  }

  const result = await AdminDataService.createProvider(ctx, data);
  if (!result.success) return { success: false, error: result.error.message };

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function updateProviderAction(id: string, data: any) {
  const ctx = await getCtx();
  
  // Critical change detection - can move to service if we want full isolation
  // But keepers for provider API/URL are sensitive.
  const oldResult = await AdminDataService.getProvidersWithStats(ctx, 'all');
  const old = oldResult.success ? oldResult.data.find(p => p.id === id) : null;
  
  const isCritical = old && (old.apiKey !== data.apiKey || old.apiUrl !== data.apiUrl);
  
  if (isCritical) {
    const verified = await AdminDataService.verify2FACode(ctx, ctx.userId, data.verificationCode);
    if (!verified.success || !verified.data) {
      await AdminDataService.generate2FACode(ctx, ctx.userId);
      return { success: false, error: 'verification_required', requires2FA: true };
    }
  }

  const result = await AdminDataService.updateProvider(ctx, id, data, !!isCritical);
  if (!result.success) return { success: false, error: result.error.message };

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function deleteProviderAction(id: string) {
  const ctx = await getCtx();
  const result = await AdminDataService.deleteProvider(ctx, id);
  if (!result.success) return { success: false, error: result.error.message };

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function addProviderPaymentAction(data: { providerId: string; amount: number; type: ProviderPaymentType; description?: string }) {
  const ctx = await getCtx();
  const result = await AdminDataService.addProviderPayment(ctx, data);
  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function getProviderSecurityReportAction(providerId: string) {
  await getCtx();
  try {
    const report = await FinancialSecurityService.getProviderSlippage(providerId);
    return { success: true, report };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Backward compatibility redirects
export async function deleteProvider(id: string) {
  const res = await deleteProviderAction(id);
  if (res.success) redirect('/admin/providers');
}

export async function createProvider(formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    type: formData.get('type') as string || 'universal',
    apiKey: formData.get('apiKey') as string,
    apiUrl: formData.get('apiUrl') as string,
    isEnabled: formData.get('isEnabled') === 'on' || formData.get('isEnabled') === 'true',
    balanceThreshold: Number(formData.get('balanceThreshold') || 1000),
    balanceCurrency: formData.get('balanceCurrency') as string || 'RUB',
    pricesCurrency: formData.get('pricesCurrency') as string || 'RUB',
  };

  const res = await createProviderAction(data);
  if (res.success) redirect('/admin/providers');
}
