'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { AdminServices } from '@/services/admin/registry';
import { AdminContext } from '@/services/types';

export async function createExpenseAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const category = formData.get('category') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string;
  const dateStr = formData.get('date') as string;
  let projectId = formData.get('projectId') as string | null;

  if (projectId === '') projectId = null;

  const result = await AdminServices.finance.createExpense(ctx, {
    category,
    amount,
    description,
    date: dateStr, // Service handles parsing via Zod
    projectId
  });

  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/expenses');
  revalidatePath('/admin/reports');
}

export async function deleteExpenseAction(id: string) {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminServices.finance.deleteExpense(ctx, id);
  if (!result.success) throw new Error(result.error.message);

  revalidatePath('/admin/expenses');
}

export async function getExpensesTotal(startDate: string, endDate: string) {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminServices.finance.getExpensesTotal(ctx, startDate, endDate);
  if (!result.success) throw new Error(result.error.message);

  return result.data;
}
