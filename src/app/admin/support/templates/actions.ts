'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { AdminSupportService } from '@/services/admin/admin-support.service';
import { AdminContext } from '@/services/types';

async function getCtx(): Promise<AdminContext> {
  const session = await getAdminSession();
  if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) throw new Error('Unauthorized');
  return {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };
}

export async function createTemplateAction(title: string, content: string) {
  const ctx = await getCtx();
  const result = await AdminSupportService.getInstance().createSupportTemplate(ctx, { title, content });
  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/support/templates');
  return { success: true };
}

export async function updateTemplateAction(id: string, title: string, content: string) {
  const ctx = await getCtx();
  const result = await AdminSupportService.getInstance().updateSupportTemplate(ctx, id, { title, content });
  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/support/templates');
  return { success: true };
}

export async function deleteTemplateAction(id: string) {
  const ctx = await getCtx();
  const result = await AdminSupportService.getInstance().deleteSupportTemplate(ctx, id);
  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/support/templates');
  return { success: true };
}
