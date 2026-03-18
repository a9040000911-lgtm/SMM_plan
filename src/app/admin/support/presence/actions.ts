'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getAdminSession } from '@/utils/admin-session';
import { AdminSupportService } from '@/services/admin/admin-support.service';
import { AdminContext } from '@/services/types';

async function getCtx(): Promise<AdminContext & { username: string }> {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');
  return {
    userId: session.id,
    role: session.role as any,
    username: session.username || 'Admin',
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };
}

/**
 * Обновляет метку присутствия сотрудника в тикете
 */
export async function setPresence(ticketId: string) {
  const ctx = await getCtx();
  const result = await AdminSupportService.getInstance().setSupportPresence(ctx, ticketId, ctx.username);
  if (!result.success) throw new Error(result.error.message);
  return { success: true };
}

/**
 * Проверяет, кто сейчас в тикете (кроме текущего админа)
 */
export async function getTicketPresence(ticketId: string) {
  const ctx = await getCtx();
  const result = await AdminSupportService.getInstance().getSupportPresence(ctx, ticketId, ctx.username);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}


