'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ProjectService } from '@/services/core';
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

export async function createProjectAction(prevState: any, formData: FormData) {
  const ctx = await getCtx();
  if (!ctx.isGlobalAdmin) return { error: 'Unauthorized' };

  const data = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    botToken: formData.get('botToken') as string,
    domain: formData.get('domain') as string,
    brandColor: formData.get('brandColor') as string,
  };

  if (!data.name || !data.slug) return { error: 'Имя и Slug обязательны' };

  const result = await AdminDataService.createProject(ctx, data);
  if (!result.success) {
    if (result.error.code === 'P2002' || result.error.message.includes('unique')) {
       return { error: 'Проект с таким slug или доменом уже существует.' };
    }
    return { error: result.error.message };
  }

  ProjectService.clearCache();
  revalidatePath('/admin/settings');
  revalidatePath('/admin/projects');

  redirect('/admin/settings?tab=projects');
}

export async function updateProjectAction(id: string, formData: FormData) {
  const ctx = await getCtx();
  const data = {
    name: formData.get('name') as string,
    botToken: formData.get('botToken') as string,
    domain: formData.get('domain') as string,
    brandColor: formData.get('brandColor') as string,
    maintenanceMode: formData.get('maintenanceMode') === 'on',
    loyaltySettings: {
      levels: formData.get('loyalty_levels') === 'on',
      referrals: formData.get('loyalty_referrals') === 'on',
      earlyBird: formData.get('loyalty_earlyBird') === 'on',
    }
  };

  const result = await AdminDataService.updateProject(ctx, id, data);
  if (!result.success) throw new Error(result.error.message);

  ProjectService.clearCache();
  revalidatePath('/admin/settings');
}

export async function requestProjectSettings2FA() {
  const ctx = await getCtx();
  const result = await AdminDataService.generate2FACode(ctx, ctx.userId);
  if (!result.success) return { error: result.error.message };

  return { success: true, sentTo: result.data.sentTo };
}

export async function updateProjectPricingRulesAction(id: string, rules: any[], code?: string) {
  const ctx = await getCtx();
  if (!code) return { error: 'Требуется код подтверждения' };

  const verified = await AdminDataService.verify2FACode(ctx, ctx.userId, code);
  if (!verified.success || !verified.data) {
    return { error: 'Неверный или просроченный код подтверждения' };
  }

  const result = await AdminDataService.updateProjectPricingRules(ctx, id, rules);
  if (!result.success) return { error: result.error.message };

  ProjectService.clearCache();
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function updateProjectSafetyAction(id: string, settings: any) {
  const ctx = await getCtx();
  const result = await AdminDataService.updateProjectSafety(ctx, id, settings);
  if (!result.success) throw new Error(result.error.message);

  ProjectService.clearCache();
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function updateProjectPaymentAction(id: string, settings: any) {
  const ctx = await getCtx();
  const result = await AdminDataService.updateProjectPayment(ctx, id, settings);
  if (!result.success) throw new Error(result.error.message);

  ProjectService.clearCache();
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function updateProjectConfigAction(id: string, config: any) {
  const ctx = await getCtx();
  const result = await AdminDataService.updateProjectConfig(ctx, id, config);
  if (!result.success) throw new Error(result.error.message);

  ProjectService.clearCache();
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function deleteProjectAction(id: string) {
  const ctx = await getCtx();
  // Protection logic can move to service if needed, keeping here for now as simple check
  const projectResult = await AdminDataService.getProjectRaw(ctx, id);
  if (projectResult.success && projectResult.data.slug === 'default') {
    throw new Error('Cannot delete default project');
  }

  const result = await AdminDataService.deleteProject(ctx, id);
  if (!result.success) throw new Error(result.error.message);

  ProjectService.clearCache();
  revalidatePath('/admin/projects');
}

export async function setActiveProjectContextAction(projectId: string) {
  const cookieStore = await cookies();
  cookieStore.set('active_project_id', projectId, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  revalidatePath('/admin');
  return { success: true };
}
