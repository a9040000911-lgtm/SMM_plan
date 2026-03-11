/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SupportUser, SupportTicket, MessageSender, TicketStatus } from '@/types/support';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: visitorId } = await params; // This is the user's ID
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all tickets for this user, ordered: OPEN first, then PENDING, then CLOSED
    const tickets = await prisma.supportTicket.findMany({
        where: { userId: visitorId },
        orderBy: [
            { status: 'asc' }, // CLOSED comes last alphabetically
            { updatedAt: 'desc' }
        ],
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                take: limit,
                skip: (page - 1) * limit
            },
            _count: { select: { messages: true } }
        }
    });

    // Get user info
    const user = await prisma.user.findUnique({
        where: { id: visitorId },
        select: {
            id: true,
            username: true,
            balance: true,
            spent: true,
            tgId: true,
            createdAt: true
        }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate stats
    const openCount = tickets.filter(t => t.status === 'OPEN').length;
    const pendingCount = tickets.filter(t => t.status === 'PENDING').length;
    const closedCount = tickets.filter(t => t.status === 'CLOSED').length;

    // Get templates and macros for quick actions
    const templates = await prisma.supportTemplate.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10
    });

    const macros = await prisma.supportMacro.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10
    });

    // Serialize User
    const serializedUser: SupportUser = {
        id: user.id,
        username: user.username,
        balance: user.balance.toString(),
        spent: user.spent.toString(),
        tgId: user.tgId?.toString() || '',
        createdAt: user.createdAt.toISOString()
    };

    // Serialize Tickets
    const serializedTickets: SupportTicket[] = tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status as TicketStatus,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        messages: t.messages.map(m => ({
            id: m.id,
            sender: m.sender as MessageSender,
            text: m.text,
            createdAt: m.createdAt.toISOString(),
            imageUrl: m.imageUrl || undefined
        })),
        _count: t._count
    }));

    return NextResponse.json({
        user: serializedUser,
        tickets: serializedTickets,
        stats: {
            total: tickets.length,
            open: openCount,
            pending: pendingCount,
            closed: closedCount
        },
        templates: templates.map(t => ({ id: t.id, name: t.title, template: t.content })),
        macros,
        pagination: {
            page,
            limit,
            hasMore: tickets.some(t => t._count.messages > limit)
        }
    });
}
