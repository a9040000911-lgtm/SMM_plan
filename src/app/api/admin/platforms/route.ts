/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const platforms = await prisma.socialPlatform.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(platforms);
    } catch (error) {
        console.error('Failed to fetch platforms:', error);
        return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 });
    }
}


