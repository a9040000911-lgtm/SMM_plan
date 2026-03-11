/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, username: true, balance: true, spent: true, tgId: true } },
            messages: { orderBy: { createdAt: 'asc' } }
        }
    });

    if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Получаем ВСЮ историю переписки с пользователем (все тикеты)
    const allUserTickets = await prisma.supportTicket.findMany({
        where: { userId: ticket.user.id },
        orderBy: { createdAt: 'asc' },
        include: {
            messages: { orderBy: { createdAt: 'asc' } }
        }
    });

    // Формируем единую историю с разделителями по тикетам
    const conversationHistory = allUserTickets.flatMap(t => {
        const ticketHeader = {
            id: `header-${t.id}`,
            sender: 'SYSTEM' as const,
            text: `── Тикет: ${t.subject} (${t.status}) ──`,
            createdAt: t.createdAt,
            isHeader: true,
            ticketId: t.id,
            ticketStatus: t.status
        };
        return [ticketHeader, ...t.messages.map(m => ({ ...m, ticketId: t.id }))];
    });

    return NextResponse.json({
        ...ticket,
        conversationHistory,
        allTickets: allUserTickets.map(t => ({ id: t.id, subject: t.subject, status: t.status, createdAt: t.createdAt }))
    });
}
