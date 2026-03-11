'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { BotRegistry } from '@/lib/bot';
import { revalidatePath } from 'next/cache';
import { TicketService } from '@/services/support';

import { getAdminSession } from '@/utils/admin-session';

// Helper internal function
async function requireSupportOrAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Session not found');
  }
  if (!['ADMIN', 'SUPPORT'].includes(session.role)) {
    throw new Error(`Forbidden: Role ${session.role} is not authorized for support actions`);
  }
  return session;
}

export async function replyToTicketAction(ticketId: string, text: string) {
  const adminData = await requireSupportOrAdmin();

  const res = await TicketService.sendStaffReply(ticketId, text, adminData.id || '', adminData.username);

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath('/admin/support');
  return res;
}

export async function closeTicketAction(ticketId: string) {
  const adminData = await requireSupportOrAdmin();

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: 'CLOSED' }
  });

  if (adminData?.id) {
    await prisma.adminLog.create({
      data: {
        adminId: adminData.id,
        action: 'TICKET_CLOSE',
        targetId: ticketId,
        details: 'Closed support ticket'
      }
    });
  }

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath('/admin/support');
  return { success: true };
}

export async function createTicketByAdminAction(userId: string, subject: string, initialMessage: string = '') {
  const adminData = await requireSupportOrAdmin();

  // Создаем тикет (используем getOrCreateTicket чтобы не дублировать если уже есть открытый с такой темой, 
  // хотя для "Нового тикета" логичнее принудительно создавать, но следуем общей логике)
  // В данном случае, если админ явно создает тикет, мы можем использовать createTicket или getOrCreateTicket.
  // Используем getOrCreateTicket для консистентности.
  const ticket = await TicketService.getOrCreateTicket(userId, subject);

  if (initialMessage) {
    await TicketService.sendStaffReply(ticket.id, initialMessage, adminData.id || '', adminData.username);
  } else {
    // Если сообщения нет, просто ревалидируем
    revalidatePath('/admin/support');
  }

  return { success: true, ticketId: ticket.id };
}

/**
 * Старая логика (для совместимости)
 */
export async function sendMessageToUserAction(userId: string, message: string) {
  await requireSupportOrAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tgId: true, projectId: true }
  });
  if (!user || !user.tgId) throw new Error('User Telegram ID not found');

  await BotRegistry.get(user.projectId).telegram.sendMessage(
    Number(user.tgId),
    `🆘 <b>Сообщение от поддержки:</b>\n\n${message}`,
    { parse_mode: 'HTML' }
  );
  return { success: true };
}

export async function updateSupportNotesAction(userId: string, notes: string) {
  await requireSupportOrAdmin();
  await prisma.user.update({ where: { id: userId }, data: { supportNotes: notes } });
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function getStuckOrders() {
  await requireSupportOrAdmin();
  const oneHourAgo = new Date(Date.now() - 3600000);
  return await prisma.order.findMany({
    where: { status: { in: ['PENDING', 'PROCESSING'] }, createdAt: { lte: oneHourAgo } },
    include: { user: true, internalService: true },
    orderBy: { createdAt: 'asc' },
    take: 10
  });
}

export async function addInternalNoteAction(ticketId: string, text: string) {
  const adminData = await requireSupportOrAdmin();

  await TicketService.sendInternalNote(ticketId, text, adminData.username);

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath('/admin/support');
  return { success: true };
}
