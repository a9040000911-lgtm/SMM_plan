/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";

import { getClientProjectId } from '@/utils/project-resolver';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line unused-imports/no-unused-vars
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = await getClientProjectId();
        if (!projectId) {
            return NextResponse.json({ error: 'Project context missing' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { email: session.user.email, projectId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const transactions = await prisma.transaction.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                amount: true,
                type: true,
                status: true,
                createdAt: true,
                currency: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({
            transactions: transactions.map(t => ({
                id: t.id,
                amount: t.amount,
                type: t.type,
                status: t.status,
                createdAt: t.createdAt,
                currency: t.currency
            }))
        });

    } catch (error: any) {
        console.error('[API Client Transactions GET Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


