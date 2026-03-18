'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { getAdminSession } from '@/utils/admin-session';
import { revalidatePath } from 'next/cache';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export async function updateStaffAccessAction(userId: string, projectIds: string[], isGlobal: boolean, allowedTabs: string[] = [], permissions: string[] = []) {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.updateStaffAccess(ctx, userId, {
      projectIds,
      isGlobal,
      allowedTabs,
      permissions
  });

  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/employees');
  return { success: true };
}

export async function createEmployeeAction(data: any) {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.createEmployee(ctx, data);
  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/employees');
  return { success: true, userId: result.data.id };
}

export async function deleteEmployeeAction(userId: string) {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.deleteEmployee(ctx, userId);
  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/employees');
  return { success: true };
}


