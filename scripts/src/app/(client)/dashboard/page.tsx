/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { DashboardUI } from "@/components/stitch/dashboard/DashboardUI";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Дашборд — Ваш обзор деятельности | Smmplan' };

async function getUser() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    const projectId = await getClientProjectId();
    const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
    if (!user) redirect('/login');
    return user;
}

export default async function DashboardPage() {
    const user = await getUser();

    const [activeCount, completedCount, totalSpentAgg] = await Promise.all([
        prisma.order.count({ where: { userId: user.id, status: { in: ['PENDING', 'PROCESSING', 'IN_PROGRESS'] } } }),
        prisma.order.count({ where: { userId: user.id, status: 'COMPLETED' } }),
        prisma.order.aggregate({ where: { userId: user.id }, _sum: { totalPrice: true } }),
    ]);

    const recentOrders = await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { internalService: { select: { name: true, platform: true } } }
    });

    const totalSpentValue = totalSpentAgg._sum.totalPrice?.toNumber() || 0;

    const serializedUser = JSON.parse(JSON.stringify(user));
    const serializedOrders = JSON.parse(JSON.stringify(recentOrders));

    return (
        <DashboardUI
            user={serializedUser}
            stats={{
                activeCount,
                completedCount,
                totalSpent: totalSpentValue
            }}
            recentOrders={serializedOrders}
        />
    );
}
