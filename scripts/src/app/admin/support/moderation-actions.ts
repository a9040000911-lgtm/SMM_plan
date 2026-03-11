"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TicketService } from "@/services/support";
import { BroadcastService } from "@/services/support";

export async function warnUserAction(userId: string, reason: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("Пользователь не найден");

    const newWarningCount = user.warningCount + 1;
    let banExpiresAt = user.banExpiresAt;
    let moderationNote = user.moderationNote || "";
    moderationNote += `\n[${new Date().toLocaleString()}] Предупреждение: ${reason}`;

    // Автоматический бан на 24 часа при достижении 3 предупреждений
    if (newWarningCount >= 3) {
        banExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        moderationNote += `\n[${new Date().toLocaleString()}] Автоматическая блокировка на 24ч (3 предупреждения)`;
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            warningCount: newWarningCount,
            banExpiresAt,
            moderationNote
        }
    });

    // Уведомление пользователя в бота
    if (user.tgId) {
        const msg = newWarningCount >= 3
            ? `🚫 <b>ВЫ ЗАБЛОКИРОВАНЫ НА 24 ЧАСА</b>\n────────────────────\nПричина: Частое нарушение правил (3-е предупреждение).\n\nВаше право на использование поддержки временно ограничено.`
            : `⚠️ <b>ВАМ ВЫНЕСЕНО ПРЕДУПРЕЖДЕНИЕ</b>\n────────────────────\nПричина: ${reason}\n\nПожалуйста, соблюдайте правила общения. При получении 3-х предупреждений ваш аккаунт будет временно заблокирован.`;

        await BroadcastService.notifyUser(user.tgId, msg).catch(() => { });
    }

    // Логирование в систему тикетов (как системное сообщение)
    const openTicket = await prisma.supportTicket.findFirst({
        where: { userId, status: { not: 'CLOSED' } },
        orderBy: { updatedAt: 'desc' }
    });

    if (openTicket) {
        await TicketService.addMessage(openTicket.id, 'SYSTEM' as any, `⚠️ Пользователю вынесено предупреждение. Всего: ${newWarningCount}`);
        if (newWarningCount >= 3) {
            await TicketService.addMessage(openTicket.id, 'SYSTEM' as any, `🚫 Автоматическая блокировка на 24ч`);
        }
    }

    revalidatePath('/admin/support');
    revalidatePath(`/admin/support/${userId}`);
    return { success: true };
}

export async function banUserAction(userId: string, durationHours: number | 'PERMANENT', reason: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("Пользователь не найден");

    let banExpiresAt: Date | null = null;
    let isPermanentlyBanned = false;
    let durationText = "";

    if (durationHours === 'PERMANENT') {
        isPermanentlyBanned = true;
        durationText = "навсегда";
    } else {
        banExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        durationText = `на ${durationHours} ч.`;
    }

    let moderationNote = user.moderationNote || "";
    moderationNote += `\n[${new Date().toLocaleString()}] Блокировка (${durationText}): ${reason}`;

    await prisma.user.update({
        where: { id: userId },
        data: {
            banExpiresAt,
            isPermanentlyBanned,
            moderationNote
        }
    });

    if (user.tgId) {
        const msg = isPermanentlyBanned
            ? `🚫 <b>ВАШ АККАУНТ ЗАБЛОКИРОВАН НАВСЕГДА</b>\n────────────────────\nПричина: ${reason}\n\nВы больше не можете пользоваться услугами поддержки.`
            : `🚫 <b>ВАШ АККАУНТ ЗАБЛОКИРОВАН ${durationText.toUpperCase()}</b>\n────────────────────\nПричина: ${reason}\n\nДоступ к поддержке временно ограничен.`;

        await BroadcastService.notifyUser(user.tgId, msg).catch(() => { });
    }

    const openTicket = await prisma.supportTicket.findFirst({
        where: { userId, status: { not: 'CLOSED' } },
        orderBy: { updatedAt: 'desc' }
    });

    if (openTicket) {
        await TicketService.addMessage(openTicket.id, 'SYSTEM' as any, `🚫 Пользователь заблокирован (${durationText}). Причина: ${reason}`);
    }

    revalidatePath('/admin/support');
    revalidatePath(`/admin/support/${userId}`);
    return { success: true };
}

export async function unbanUserAction(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Пользователь не найден");

    await prisma.user.update({
        where: { id: userId },
        data: {
            banExpiresAt: null,
            isPermanentlyBanned: false,
            warningCount: 0 // Сбрасываем варны при ручной разблокировке? Обычно да
        }
    });

    if (user.tgId) {
        await BroadcastService.notifyUser(user.tgId, `✅ <b>ВАША БЛОКИРОВКА СНЯТА</b>\n────────────────────\nВы снова можете пользоваться поддержкой. Пожалуйста, не нарушайте правила.`).catch(() => { });
    }

    const openTicket = await prisma.supportTicket.findFirst({
        where: { userId, status: { not: 'CLOSED' } },
        orderBy: { updatedAt: 'desc' }
    });

    if (openTicket) {
        await TicketService.addMessage(openTicket.id, 'SYSTEM' as any, `✅ Блокировка снята администратором`);
    }

    revalidatePath('/admin/support');
    revalidatePath(`/admin/support/${userId}`);
    return { success: true };
}
