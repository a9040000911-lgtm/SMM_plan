'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { TicketService } from '@/services/support';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function executeMacroAction(ticketId: string, macroId: string) {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    const { verifyAdminSession } = await import('@/lib/jwt');
    const adminData = session ? await verifyAdminSession(session.value) : null;
    if (!adminData) return { success: false, error: 'Unauthorized' };

    try {
        const macro = await prisma.supportMacro.findUnique({
            where: { id: macroId }
        });

        if (!macro) throw new Error('Macro not found');

        const actions = macro.actions as any;

        // 1. Send Text if present
        if (macro.text) {
            await TicketService.sendStaffReply(ticketId, macro.text, adminData.id, adminData.username);
        }

        // 2. Process other actions
        if (actions.status) {
            await prisma.supportTicket.update({
                where: { id: ticketId },
                data: { status: actions.status }
            });
        }

        if (actions.close) {
            await prisma.supportTicket.update({
                where: { id: ticketId },
                data: { status: 'CLOSED' }
            });
        }

        if (actions.internalNote) {
            await TicketService.sendInternalNote(ticketId, actions.internalNote, adminData.username);
        }

        revalidatePath(`/admin/support/${ticketId}`);
        revalidatePath('/admin/support');

        return { success: true };
    } catch (error: any) {
        console.error('Macro Execution Error:', error);
        return { success: false, error: error.message };
    }
}
