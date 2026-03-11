/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";

import { prisma } from '@/lib/prisma';
import { TicketVerificationService } from '@/services/support';

// POST /api/client/support - создать support ticket
export async function POST(_request: NextRequest) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await _request.json();
        const { subject, text, orderId } = body;

        if (!subject || !text) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Получаем user для текущей сессии
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // --- BAN CHECK ---
        const isBanned = user.isPermanentlyBanned || (user.banExpiresAt && user.banExpiresAt > new Date());
        if (isBanned) {
            return NextResponse.json({ error: 'Ваш доступ к поддержке ограничен.' }, { status: 403 });
        }

        // Создаем тикет
        const ticket = await prisma.supportTicket.create({
            data: {
                projectId: user.projectId,
                userId: user.id,
                subject: subject,
                status: 'OPEN',
                messages: {
                    create: {
                        sender: 'USER',
                        text: text
                    }
                }
            },
            include: {
                messages: { orderBy: { createdAt: 'asc' }, take: 1 }
            }
        });

        // ✨ Автоматическая верификация
        let verification: any = { verified: false, userId: undefined, method: undefined };

        // Если указан orderId - добавляем его в текст для auto-verification
        if (orderId && (ticket as any).messages?.[0]) {
            await prisma.supportMessage.update({
                where: { id: (ticket as any).messages[0].id },
                data: { text: `[Order: ${orderId}] ${text}` }
            });
        }

        verification = await TicketVerificationService.autoVerify(ticket.id);

        return NextResponse.json({
            success: true,
            ticketId: ticket.id,
            verified: verification.verified,
            message: verification.verified
                ? 'Тикет создан и автоматически верифицирован'
                : 'Тикет создан'
        });

    } catch (error) {
        console.error('Error creating support ticket:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/client/support - получить тикеты текущего пользователя
export async function GET(_request: NextRequest) {
    try {
        const session = await auth();
        const userId = (session as any)?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.isPermanentlyBanned || (user?.banExpiresAt && user.banExpiresAt > new Date())) {
            return NextResponse.json({ tickets: [] });
        }

        const tickets = await (prisma as any).supportTicket.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { verifiedUserId: userId }
                ]
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                order: {
                    select: {
                        id: true,
                        status: true,
                        internalService: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ tickets });

    } catch (error) {
        console.error('Error fetching support tickets:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
