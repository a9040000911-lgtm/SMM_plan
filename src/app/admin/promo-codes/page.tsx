/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { PromoCodesList } from './PromoCodesList';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';
import { getActiveProjectId } from '@/utils/project-resolver';
import { redirect } from 'next/navigation';
import { AdminHeader } from '@/components/admin/core/admin-header';

export const dynamic = 'force-dynamic';

export default async function AdminPromoCodesPage() {
    const session = await getAdminSession();
    if (!session) {
        redirect('/admin/login');
    }

    const projectId = await getActiveProjectId();
    const isGlobalAdmin = session?.isGlobalAdmin || false;
    const allowedProjects = session?.allowedProjects || [];

    // 1. Fetch Projects for the dropdown
    const projects = await prisma.project.findMany({
        where: isGlobalAdmin ? {} : { id: { in: allowedProjects } },
        select: { id: true, name: true, brandColor: true }
    });

    // 2. Fetch Promo Codes filtered by active project
    const promoCodes = await prisma.promoCode.findMany({
        where: projectId === 'all' ? {} : { projectId: projectId },
        orderBy: { isActive: 'desc' },
        include: { project: true }
    });

    return (
        <div className="max-w-[1400px] mx-auto space-y-8">
            <AdminHeader
                title="Промокоды"
                subtitle="Управление скидочными кодами для маркетинга и поддержки клиентов"
                projects={projects}
                projectId={projectId}
            />

            <PromoCodesList
                initialCodes={JSON.parse(JSON.stringify(promoCodes))}
                projects={projects}
                activeProjectId={projectId === 'all' ? null : projectId}
            />
        </div>
    );
}
