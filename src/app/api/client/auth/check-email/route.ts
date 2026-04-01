/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        const projectId = await getClientProjectId();
        if (!projectId) return NextResponse.json({ error: 'Project context missing' }, { status: 400 });

        const user = await prisma.user.findFirst({
            where: { email: email.toLowerCase(), projectId },
            select: { balance: true, password: true }
        });

        return NextResponse.json({ 
            exists: !!user,
            balance: user ? Number(user.balance) : 0,
            hasPassword: !!user?.password 
        });
    } catch (_error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
