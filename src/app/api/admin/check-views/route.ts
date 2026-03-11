/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const services = await prisma.internalService.findMany({
            where: {
                category: 'VIEWS',
                OR: [
                    { name: { contains: 'подписчик', mode: 'insensitive' } },
                    { name: { contains: 'member', mode: 'insensitive' } },
                    { name: { contains: 'user', mode: 'insensitive' } },
                    { name: { contains: 'аккаунт', mode: 'insensitive' } }
                ]
            }
        });

        return NextResponse.json({
            count: services.length,
            services: services.map(s => ({ id: s.id, name: s.name }))
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
