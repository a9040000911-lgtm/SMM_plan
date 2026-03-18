/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { AdminScheduledOrdersUI } from '@/components/stitch/admin/AdminScheduledOrdersUI';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Расписание запусков | Admin Smmplan' };

export default async function AdminScheduledOrdersPage() {
    const session = await getAdminSession();
    if (!session) redirect('/admin/login');

    const isGlobalAdmin = session.isGlobalAdmin;
    const allowedProjects = session.allowedProjects || [];

    const where: any = {};
    if (!isGlobalAdmin) {
        where.projectId = { in: allowedProjects };
    }

    const scheduledOrders = await prisma.scheduledOrder.findMany({
        where,
        orderBy: { scheduleTime: 'asc' },
        include: {
            user: { select: { email: true, username: true } },
            project: { select: { name: true, brandColor: true } },
            service: { select: { name: true, platform: true } }
        }
    });

    const serialized = JSON.parse(JSON.stringify(scheduledOrders));

    return (
        <div className="p-4 sm:p-5 space-y-6">
            <AdminHeader
                title="Расписание запусков"
                subtitle="Контроль отложенных и цикличных задач"
            />
            <AdminScheduledOrdersUI initialOrders={serialized} />
        </div>
    );
}


