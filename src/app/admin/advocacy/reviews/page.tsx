/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { getAdminSession } from '@/utils/admin-session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ReviewModerationList } from '@/components/admin/advocacy/review-moderation-list';

export const dynamic = 'force-dynamic';

export default async function ReviewModeration() {
    const session = await getAdminSession();
    if (!session) redirect('/admin/login');

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || !['ADMIN', 'SEO'].includes(user.role)) redirect('/admin/login');

    const reviews = await prisma.review.findMany({
        where: {
            ...(user.projectId ? { projectId: user.projectId } : {}),
            status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
            user: { select: { username: true, tgId: true } },
            order: { select: { id: true, internalService: { select: { name: true } } } }
        }
    });

    const serialized = reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        content: r.text || r.content || '',
        username: r.user.username || `User ${r.user.tgId}`,
        orderId: r.orderId || '',
        createdAt: r.createdAt.toISOString(),
        status: r.status
    }));

    return (
        <div className="p-4 sm:p-5 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Модерация отзывов</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Проверка UGC и начисление бонусов за лояльность</p>
            </div>

            <ReviewModerationList initialReviews={serialized} />
        </div>
    );
}
