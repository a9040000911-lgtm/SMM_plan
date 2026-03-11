'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { TicketService } from '@/services/support';
import { handleRefund } from '@/services/orders';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { Decimal } from 'decimal.js';

async function getAdminData() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) return null;
  const { verifyAdminSession } = await import('@/lib/jwt');
  return await verifyAdminSession(session.value);
}

export async function executeMacroAction(ticketId: string, macroId: string) {
  const admin = await getAdminData();
  if (!admin || !['ADMIN', 'SUPPORT'].includes(admin.role)) throw new Error('Unauthorized');

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: true }
  });

  const macro = await prisma.supportMacro.findUnique({
    where: { id: macroId }
  });

  if (!ticket || !macro) throw new Error('Ticket or Macro not found');

  const actions = macro.actions as any[];
  const results = [];
  let grantedPromo: string | null = null;

  for (const action of actions) {
    try {
      // 1. ВЫДАЧА ПРОМОКОДА
      if (action.type === 'GIVE_PROMOCODE') {
        const promoCode = await prisma.promoCode.findUnique({
          where: { id: action.promoId || '' }
        });

        if (promoCode) {
          await prisma.userPromo.upsert({
            where: { userId_promoCodeId: { userId: ticket.userId, promoCodeId: promoCode.id } },
            update: { usedAt: null }, // Разрешаем использовать заново если был использован
            create: { userId: ticket.userId, promoCodeId: promoCode.id }
          });
          grantedPromo = promoCode.code;
          results.push(`Promo ${promoCode.code} granted`);
        }
      }

      // 2. ОТПРАВКА СООБЩЕНИЯ
      if (action.type === 'SEND_MESSAGE') {
        let finalMsg = macro.text.replace('{username}', ticket.user.username || 'клиент');
        if (grantedPromo) {
          finalMsg = finalMsg.replace('{promo}', grantedPromo);
        }
        await TicketService.sendStaffReply(ticketId, finalMsg, admin.username);
        results.push('Message sent');
      }

      // 3. ВОЗВРАТ СРЕДСТВ
      if (action.type === 'REFUND_LAST_ORDER') {
        const lastOrder = await prisma.order.findFirst({
          where: { userId: ticket.userId, status: { in: ['PROCESSING', 'PENDING'] } },
          orderBy: { createdAt: 'desc' }
        });
        if (lastOrder) {
          await handleRefund(lastOrder, 'CANCELED', 0);
          results.push(`Order #${lastOrder.id} refunded`);
        }
      }

      // 4. НАЧИСЛЕНИЕ БОНУСА
      if (action.type === 'ADD_BONUS') {
        const amount = action.amount || 0;
        await prisma.user.update({
          where: { id: ticket.userId },
          data: { balance: { increment: amount } }
        });
        await prisma.transaction.create({
          data: {
            projectId: ticket.user.projectId,
            userId: ticket.userId,
            amount: new Decimal(amount),
            type: 'DEPOSIT',
            provider: 'INTERNAL',
            status: 'COMPLETED',
            metadata: { adminNote: `Macro Bonus: ${macro.title}` }
          }
        });
        results.push(`Bonus ${amount} RUB added`);
      }

      // 5. ЗАКРЫТИЕ ТИКЕТА
      if (action.type === 'CLOSE_TICKET') {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'CLOSED' }
        });
        results.push('Ticket closed');
      }
    } catch (e: any) {
      console.error(`Macro step failed: ${action.type}`, e.message);
    }
  }

  await prisma.adminLog.create({
    data: {
      adminId: admin.username,
      action: 'EXECUTE_MACRO',
      targetId: ticketId,
      details: `Macro "${macro.title}" executed. results: ${results.join(', ')}`
    }
  });

  revalidatePath(`/admin/support/${ticketId}`);
  return { success: true, log: results };
}

export async function createMacroAction(data: { title: string, text: string, actions: any[] }) {
  await prisma.supportMacro.create({ data });
  revalidatePath('/admin/support/macros');
  return { success: true };
}

export async function deleteMacroAction(id: string) {
  await prisma.supportMacro.delete({ where: { id } });
  revalidatePath('/admin/support/macros');
  return { success: true };
}
