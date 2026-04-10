/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';

export async function GET(request: NextRequest) {
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
        const isNumeric = /^#?\d+$/.test(search);
        const cleanSearch = search.startsWith('#') ? search.substring(1) : search;

        where.OR = [
            { subject: { contains: search, mode: 'insensitive' } },
            ...(isNumeric ? [{ orderId: parseInt(cleanSearch) }] : []),
            { user: { username: { contains: search, mode: 'insensitive' } } },
        ];
    }

    const tickets = await prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
            user: { select: { id: true, username: true, balance: true, spent: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            _count: { select: { messages: true } }
        }
    });

    const templates = await prisma.supportTemplate.findMany({
        orderBy: { updatedAt: 'desc' }
    });

    const macros = await prisma.supportMacro.findMany({
        orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ tickets, templates, macros });
}


