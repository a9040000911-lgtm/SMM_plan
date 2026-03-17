'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { BotRegistry } from '@/lib/bot';
import { revalidatePath } from 'next/cache';
import { TicketService } from '@/services/support';
import { getAdminSession } from '@/utils/admin-session';
import { AdminServices } from '@/services/admin/registry';
import { AdminContext } from '@/services/types';

// Helper internal function
async function requireSupportOrAdmin(): Promise<AdminContext> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Session not found');
  }
  if (!['ADMIN', 'SUPPORT'].includes(session.role)) {
    throw new Error(`Forbidden: Role ${session.role} is not authorized for support actions`);
  }
  return {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };
}

export async function replyToTicketAction(ticketId: string, text: string) {
  const ctx = await requireSupportOrAdmin();
  const res = await TicketService.sendStaffReply(ticketId, text, ctx.userId || '', 'Staff');

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath('/admin/support');
  return res;
}

export async function closeTicketAction(ticketId: string) {
  const ctx = await requireSupportOrAdmin();
  const result = await AdminServices.support.closeTicket(ctx, ticketId);
  if (!result.success) throw new Error(result.error.message);

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath('/admin/support');
  return { success: true };
}

export async function createTicketByAdminAction(userId: string, subject: string, initialMessage: string = '') {
  const ctx = await requireSupportOrAdmin();
  const ticket = await TicketService.getOrCreateTicket(userId, subject);

  if (initialMessage) {
    await TicketService.sendStaffReply(ticket.id, initialMessage, ctx.userId || '', 'Staff');
  } else {
    revalidatePath('/admin/support');
  }

  return { success: true, ticketId: ticket.id };
}

/**
 * Отправляет сообщение пользователю через бота.
 */
export async function sendMessageToUserAction(userId: string, message: string) {
  const ctx = await requireSupportOrAdmin();
  const result = await AdminServices.support.getSupportUserTgInfo(ctx, userId);
  if (!result.success) throw new Error(result.error.message);
  
  const { tgId, projectId } = result.data;
  if (!tgId) throw new Error('User Telegram ID not found');

  await BotRegistry.get(projectId).telegram.sendMessage(
    Number(tgId),
    `🆘 <b>Сообщение от поддержки:</b>\n\n${message}`,
    { parse_mode: 'HTML' }
  );
  return { success: true };
}

export async function updateSupportNotesAction(userId: string, notes: string) {
  const ctx = await requireSupportOrAdmin();
  const result = await AdminServices.support.updateSupportNotes(ctx, { userId, notes });
  if (!result.success) throw new Error(result.error.message);

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function getStuckOrders() {
  const ctx = await requireSupportOrAdmin();
  const result = await AdminServices.orders.getOldPendingOrders(ctx);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

export async function addInternalNoteAction(ticketId: string, text: string) {
  const ctx = await requireSupportOrAdmin();
  await TicketService.sendInternalNote(ticketId, text, 'Staff');

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath('/admin/support');
  return { success: true };
}
