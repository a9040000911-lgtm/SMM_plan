/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateProjectTMAData } from '@/utils/tma-auth';

export async function POST(req: NextRequest) {
    try {
        // 1. Auth
        const isDev = process.env.NODE_ENV === 'development';
        const authHeader = req.headers.get('Authorization');
        let tgUser: any = null;

        if (isDev) {
            tgUser = { id: 123456789, username: 'dev_user' };
        } else {
            if (authHeader && authHeader.startsWith('tma ')) {
                const auth = await validateProjectTMAData(req);
                if (auth.isValid) tgUser = auth.data?.user;
            }
        }

        if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Находим пользователя по TG ID и проекту
        const user = await prisma.user.findFirst({
            where: {
                tgId: BigInt(tgUser.id)
            }
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 2. Data
        const { subject, message, type } = await req.json();
        if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

        // Format subject based on type
        let finalSubject = subject || 'Обращение из Mini App';
        if (type === 'BUG') finalSubject = `[BUG_HUNTER] ${finalSubject}`;
        if (type === 'FEATURE') finalSubject = `[FEATURE] ${finalSubject}`;

        // 3. Create Ticket
        const ticket = await prisma.supportTicket.create({
            data: {
                userId: user.id,
                subject: finalSubject,
                status: 'OPEN',
                messages: {
                    create: {
                        sender: 'USER',
                        text: message
                    }
                }
            }
        });

        // Notify Admin (Simple console log for now, BroadcastService logic can be added if accessible)
        // In a real app we would import BroadcastService or similar.
        console.log(`New Ticket Created via Web: #${ticket.id} (${finalSubject})`);

        return NextResponse.json({ success: true, ticketId: ticket.id });

    } catch (error) {
        console.error('Support API Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
