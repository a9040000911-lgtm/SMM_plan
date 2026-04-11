/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { MessageSender } from '@prisma/client';
import { BroadcastService } from './broadcast.service';

export class TicketService {
  /**
   * Получает или создает тикет для пользователя.
   * Модель: один пользователь = одна переписка (пока тикет не закрыт вручную).
   */
  static async getOrCreateTicket(userId: string, subject: string) {
    // Ищем существующий открытый тикет
    const existingTicket = await prisma.supportTicket.findFirst({
      where: { userId, status: { not: 'CLOSED' } },
      orderBy: { updatedAt: 'desc' }
    });

    if (existingTicket) {
      // Обновляем время активности и возвращаем существующий тикет
      await prisma.supportTicket.update({
        where: { id: existingTicket.id },
        data: { updatedAt: new Date() }
      });
      return existingTicket;
    }

    // Создаем новый только если нет открытого
    // SANDBOX DATA QUARANTINE: тегируем тикет, если Песочница активна
    let ticketMetadata: any = undefined;
    try {
      const { SandboxService } = await import('@/services/core/sandbox.service');
      if (await SandboxService.isEnabled()) {
        ticketMetadata = SandboxService.tagRecord({});
      }
    } catch { /* ignore */ }

    return await prisma.supportTicket.create({
      data: { userId, subject, status: 'OPEN', ...(ticketMetadata ? { metadata: ticketMetadata } : {}) }
    });
  }

  /**
   * @deprecated Используйте getOrCreateTicket вместо этого.
   * Оставлено для обратной совместимости.
   */
  static async createTicket(userId: string, subject: string) {
    return this.getOrCreateTicket(userId, subject);
  }

  static async addMessage(
    ticketId: string,
    sender: MessageSender,
    text: string,
    options?: { staffUsername?: string; imageUrl?: string; voiceUrl?: string; videoUrl?: string; fileUrl?: string }
  ) {
    const message = await prisma.supportMessage.create({
      data: {
        ticketId,
        sender,
        text,
        staffUsername: options?.staffUsername || null,
        imageUrl: options?.imageUrl || null,
        voiceUrl: options?.voiceUrl || null,
        videoUrl: options?.videoUrl || null,
        fileUrl: options?.fileUrl || null,
      },
      include: {
        ticket: {
          include: { user: true }
        }
      }
    });

    if (sender === 'USER') {
      const mediaInfo = options?.imageUrl ? ' 📷' :
        options?.voiceUrl ? ' 🎙️' :
          options?.videoUrl ? ' 📹' :
            options?.fileUrl ? ' 📄' : '';
      const alertMsg =
        `📩 <b>НОВОЕ СООБЩЕНИЕ В ТИКЕТЕ</b>${mediaInfo}\n────────────────────\n` +
        `👤 Клиент: @${message.ticket.user.username || 'user'}\n` +
        `📝 Тема: ${message.ticket.subject}\n\n` +
        `💬 ${text ? text.substring(0, 300) + (text.length > 300 ? '...' : '') : '(медиа)'}\n\n` +
        `👉 <a href="${process.env.NEXT_PUBLIC_URL}/admin/support/${ticketId}">Открыть в терминале</a>`;

      await BroadcastService.notifyAdmin(alertMsg);
    }
    return message;
  }

  static async sendStaffReply(ticketId: string, text: string, adminId: string, adminUsername: string = 'Support') {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true }
    });

    if (!ticket) throw new Error('Ticket not found');

    await this.addMessage(ticketId, 'STAFF', text, { staffUsername: adminUsername });

    if (adminId && adminId.length > 10) {
      await prisma.adminLog.create({
        data: {
          adminId: adminId,
          action: 'TICKET_REPLY',
          targetId: ticketId,
          details: `Reply length: ${text.length}`
        }
      }).catch(() => { });
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'PENDING' }
    });

    if (ticket.user.tgId) {
      const userMsg =
        `🎧 <b>ОТВЕТ ТЕХПОДДЕРЖКИ</b>\n────────────────────\n` +
        `<i>«${ticket.subject}»</i>\n\n` +
        `${text}\n\n` +
        `────────────────────\n` +
        `👉 <i>Вы можете ответить на это сообщение прямо здесь.</i>`;

      await BroadcastService.notifyUser(ticket.user.tgId, userMsg, ticket.projectId);
    }

    return { success: true };
  }

  static async sendInternalNote(ticketId: string, text: string, adminUsername: string) {
    await this.addMessage(ticketId, 'INTERNAL' as MessageSender, text, { staffUsername: adminUsername });
    return { success: true };
  }
}


