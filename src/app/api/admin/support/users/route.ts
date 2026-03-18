/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SupportUser, MessageSender } from '@/types/support';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const filter = searchParams.get('filter') || 'active'; // 'active' | 'all'

    // Get users who have support tickets
    const usersWithTickets = await prisma.user.findMany({
        where: {
            tickets: { some: {} },
            ...(search ? {
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    // If 'id' is a string (e.g., UUID), 'contains' is appropriate.
                    // If 'id' could be a numeric string and you want exact match for numbers,
                    // you'd need more complex logic or a different field.
                    // Assuming 'id' is a string, the original 'contains' is fine.
                    // The instruction "support numeric ID" might imply searching by a numeric field
                    // within tickets, but the current query is on 'user'.
                    // Let's assume the user wants to search for user IDs that are numeric strings.
                    { id: { contains: search, mode: 'insensitive' } },
                    // Add search for tickets related to the user
                    {
                        tickets: {
                            some: {
                                OR: [
                                    { subject: { contains: search, mode: 'insensitive' } },
                                    // Assuming 'orderId' is a numeric field on the Ticket model
                                    // and we want to search for it if the search term is numeric.
                                    ...(/^\d+$/.test(search) ? [{ orderId: parseInt(search) }] : [])
                                ]
                            }
                        }
                    }
                ]
            } : {})
        },
        select: {
            id: true,
            username: true,
            balance: true,
            spent: true,
            tgId: true,
            createdAt: true,
            tickets: {
                select: {
                    id: true,
                    status: true,
                    subject: true,
                    updatedAt: true,
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            text: true,
                            sender: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Transform to include stats and filter
    const usersWithStats: SupportUser[] = usersWithTickets.map(user => {
        const openCount = user.tickets.filter(t => t.status === 'OPEN').length;
        const pendingCount = user.tickets.filter(t => t.status === 'PENDING').length;
        const closedCount = user.tickets.filter(t => t.status === 'CLOSED').length;
        const lastTicket = user.tickets[0];
        const lastMessage = lastTicket?.messages[0];

        return {
            id: user.id,
            username: user.username,
            balance: user.balance.toString(),
            spent: user.spent.toString(),
            tgId: user.tgId?.toString() || '',
            createdAt: user.createdAt.toISOString(),
            stats: {
                total: user.tickets.length,
                open: openCount,
                pending: pendingCount,
                closed: closedCount,
                hasUnread: lastMessage?.sender === 'USER' && lastTicket?.status !== 'CLOSED'
            },
            lastActivity: {
                ticketSubject: lastTicket?.subject,
                lastMessage: lastMessage?.text?.substring(0, 100),
                lastMessageSender: lastMessage?.sender as MessageSender,
                updatedAt: lastTicket?.updatedAt.toISOString()
            }
        };
    });

    // Filter based on active/all
    const filteredUsers = filter === 'active'
        ? usersWithStats.filter(u => u.stats!.open > 0 || u.stats!.pending > 0)
        : usersWithStats;

    // Sort: users with unread messages first, then by last activity
    filteredUsers.sort((a, b) => {
        if (a.stats!.hasUnread && !b.stats!.hasUnread) return -1;
        if (!a.stats!.hasUnread && b.stats!.hasUnread) return 1;
        if (a.stats!.open > 0 && b.stats!.open === 0) return -1;
        if (a.stats!.open === 0 && b.stats!.open > 0) return 1;
        return new Date(b.lastActivity!.updatedAt || 0).getTime() - new Date(a.lastActivity!.updatedAt || 0).getTime();
    });

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

    return NextResponse.json({
        users: paginatedUsers,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit),
        currentPage: page,
        totalWithOpen: filteredUsers.filter(u => u.stats!.open > 0).length,
        totalWithPending: filteredUsers.filter(u => u.stats!.pending > 0).length
    });
}


