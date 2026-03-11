'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ProviderService } from '@/services/providers';
import { cookies } from 'next/headers';
import { AdminProvider } from '@/types/admin';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/utils/admin-session';
import { TwoFactorService } from '@/services/admin/two-factor.service';
import { getActiveProjectId } from '@/utils/project-resolver';
import { PredictionService } from '@/services/users';
import { FinancialSecurityService } from '@/services/security/financial-security.service';
import { ProviderPaymentType } from '@/generated/client';
import { LogService } from '@/services/admin/log.service';

async function checkAuth() {
  const cookieStore = await cookies();
  if (!cookieStore.has('admin_session')) {
    throw new Error('Unauthorized');
  }
}

export async function getProvidersAction(): Promise<AdminProvider[]> {
  await checkAuth();
  const projectId = await getActiveProjectId();

  const providers = await prisma.provider.findMany({
    where: (!projectId || projectId === 'all') ? {} : {
      OR: [
        { projectId: null },
        { projectId: projectId }
      ]
    },
    include: {
      _count: {
        select: { balanceLogs: true, services: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  const providersWithStats = await Promise.all(providers.map(async (p) => {
    const lastBalance = await prisma.providerBalanceLog.findFirst({
      where: { providerId: p.id },
      orderBy: { createdAt: 'desc' }
    });

    return {
      id: p.id,
      name: p.name,
      type: p.type,
      apiKey: p.apiKey,
      apiUrl: p.apiUrl,
      isEnabled: p.isEnabled,
      balanceThreshold: (p as any).balanceThreshold?.toNumber() || 1000,
      currentBalance: lastBalance?.balance.toNumber() || 0,
      lastSync: lastBalance?.createdAt.toISOString() || null,
      metadata: p.metadata,
      projectId: p.projectId,
      serviceCount: p._count.services,
      balanceCurrency: p.balanceCurrency || 'RUB',
      pricesCurrency: p.pricesCurrency || 'RUB',
      _count: p._count
    } as AdminProvider;
  }));

  return providersWithStats;
}

export async function getActiveProjectContext() {
  await checkAuth();
  return { activeProjectId: await getActiveProjectId() };
}

export async function syncAllProvidersAction() {
  await checkAuth();
  const projectId = await getActiveProjectId();
  try {
    const providers = await prisma.provider.findMany({
      where: {
        isEnabled: true,
        ...((!projectId || projectId === 'all') ? {} : {
          OR: [
            { projectId: null },
            { projectId: projectId }
          ]
        })
      }
    });

    const { ServiceSyncService } = await import('@/services/providers/sync.service');
    for (const p of providers) {
      await ServiceSyncService.syncProvider(p.id);
    }

    await ProviderService.checkAndLogAllBalances();
    revalidatePath('/admin/providers');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function syncProviderAction(id: string) {
  await checkAuth();
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
  await checkAuth();
  const [forecasts, revenue] = await Promise.all([
    PredictionService.getProviderForecasts(),
    PredictionService.getRevenueForecast()
  ]);
  return { forecasts, revenue };
}

export async function createProviderAction(data: { name: string; type: string; apiKey: string; apiUrl: string; isEnabled: boolean; balanceThreshold?: number; metadata?: any; balanceCurrency?: string; pricesCurrency?: string; projectId?: string }) {
  await checkAuth();
  const projectId = await getActiveProjectId();

  const exists = await prisma.provider.findFirst({
    where: { name: data.name, projectId: projectId === 'all' ? null : projectId }
  });
  if (exists) return { success: false, error: `Провайдер ${data.name} уже существует в этом контексте` };

  await prisma.provider.create({
    data: {
      name: data.name,
      type: data.type || 'universal',
      apiKey: data.apiKey,
      apiUrl: data.apiUrl,
      isEnabled: data.isEnabled,
      balanceThreshold: (data.balanceThreshold as any) ?? 1000,
      metadata: data.metadata || {},
      balanceCurrency: (data.balanceCurrency as any) || 'RUB',
      pricesCurrency: (data.pricesCurrency as any) || 'RUB',
      projectId: data.projectId || (projectId === 'all' ? null : projectId)
    }
  });

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function updateProviderAction(id: string, data: { name: string; type: string; apiKey: string; apiUrl: string; isEnabled: boolean; balanceThreshold?: number; metadata?: any; balanceCurrency?: string; pricesCurrency?: string; verificationCode?: string }) {
  await checkAuth();

  const session = await getAdminSession();
  if (!session) throw new Error('Session invalid');

  const currentProvider = await prisma.provider.findUnique({ where: { id } });

  if (currentProvider) {
    const isCriticalChange = (currentProvider.apiKey !== data.apiKey) || (currentProvider.apiUrl !== data.apiUrl);

    if (isCriticalChange) {
      const code = data.verificationCode;
      const verified = code ? await TwoFactorService.verifyCode(session.id, code) : false;

      if (!verified) {
        const sent = await TwoFactorService.sendCode(session.id);
        if (sent) {
          return { success: false, error: 'verification_required', requires2FA: true };
        }
      }

      try {
        await LogService.log(
          session.id,
          LogService.ACTIONS.UPDATE_PROVIDER,
          id,
          `CRITICAL: Updated API credentials for provider ${currentProvider.name}. URL: ${data.apiUrl}`
        );
      } catch (e) {
        console.error('[Security] Failed to log change:', e);
      }
    }
  }

  await prisma.provider.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      apiKey: data.apiKey,
      apiUrl: data.apiUrl,
      isEnabled: data.isEnabled,
      balanceThreshold: data.balanceThreshold as any,
      metadata: data.metadata || {},
      balanceCurrency: (data.balanceCurrency as any) || 'RUB',
      pricesCurrency: (data.pricesCurrency as any) || 'RUB'
    }
  });

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function deleteProviderAction(id: string) {
  try {
    await checkAuth();
    await prisma.provider.delete({ where: { id } });
    revalidatePath('/admin/providers');
    return { success: true };
  } catch (e: any) {
    console.error('[Admin] Delete Provider Error:', e);
    return { success: false, error: e.message || 'Ошибка при удалении провайдера' };
  }
}

export async function addProviderPaymentAction(data: { providerId: string; amount: number; type: ProviderPaymentType; description?: string }) {
  await checkAuth();

  await prisma.providerPayment.create({
    data: {
      providerId: data.providerId,
      amount: data.amount,
      type: data.type,
      description: data.description,
      createdBy: 'admin'
    }
  });

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function getProviderSecurityReportAction(providerId: string) {
  await checkAuth();
  try {
    const report = await FinancialSecurityService.getProviderSlippage(providerId);
    return { success: true, report };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Backward compatibility or direct redirects
export async function deleteProvider(id: string) {
  const res = await deleteProviderAction(id);
  if (res.success) {
    redirect('/admin/providers');
  }
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
  if (res.success) {
    redirect('/admin/providers');
  }
}
