/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";


import { getClientProjectId } from '@/utils/project-resolver';

export async function GET(_req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = await getClientProjectId();

        if (!projectId) {
            return NextResponse.json({ error: "Project context missing" }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                email: session.user.email,
                projectId: projectId
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Parallel fetch for stats
        const [activeOrders, unreadTickets, totalOrders] = await Promise.all([
            prisma.order.count({
                where: {
                    userId: user.id,
                    status: { in: ['PENDING', 'PROCESSING', 'IN_PROGRESS', 'PARTIAL'] }
                }
            }),
            prisma.supportTicket.count({
                where: {
                    userId: user.id,
                    status: { in: ['OPEN', 'PENDING'] },
                    // In a real app we might check if last message is from staff, 
                    // but for now Open/Pending tickets are "active" interactions
                }
            }),
            prisma.order.count({ where: { userId: user.id } })
        ]);

        return NextResponse.json({
            activeOrders,
            unreadTickets,
            totalOrders,
            balance: user.balance.toNumber(),
            spent: user.spent.toNumber()
        });

    } catch (error) {
        console.error('[API Client Stats Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


