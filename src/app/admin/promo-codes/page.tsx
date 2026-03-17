/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { PromoCodesList } from './PromoCodesList';
import { prisma } from '@/lib/prisma';
import { getAdminSession, getActiveProjectId } from '@/utils/admin-session';
import { redirect } from 'next/navigation';
import { AdminHeader } from '@/components/admin/core/admin-header';

export const dynamic = 'force-dynamic';

export default async function AdminPromoCodesPage() {
    const session = await getAdminSession();
    if (!session) {
        redirect('/admin/login');
    }

    const projectId = await getActiveProjectId();

    // Fetch projects for header and context
    const projects = await prisma.project.findMany({
        select: { id: true, name: true, brandColor: true }
    });

    // Fetch promo codes scoped by project
    const promoCodes = await prisma.promoCode.findMany({
        where: projectId === 'all' ? {} : {
            OR: [
                { projectId: projectId },
                { projectId: null }
            ]
        },
        orderBy: { code: 'asc' },
        include: {
            project: {
                select: { name: true }
            }
        }
    });

    return (
        <div className="max-w-[1400px] mx-auto space-y-8">
            <AdminHeader 
                title="Промокоды"
                subtitle="Управление скидками, акциями и специальными предложениями"
                projects={projects}
                projectId={projectId || 'all'}
            />

            <PromoCodesList 
                initialCodes={JSON.parse(JSON.stringify(promoCodes))} 
                projects={projects}
                activeProjectId={projectId === 'all' ? null : projectId}
            />
        </div>
    );
}
