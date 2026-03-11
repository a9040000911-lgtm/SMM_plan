/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";


export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        const order = await prisma.scheduledOrder.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const user = await prisma.user.findFirst({ where: { email: session.user.email } });
        if (!user || order.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        await prisma.scheduledOrder.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Scheduled Order Delete Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
