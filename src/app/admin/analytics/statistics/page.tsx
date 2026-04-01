/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { getAdminSession } from '@/utils/admin-session';
import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';
import { StatisticsCharts } from '@/components/admin/statistics/statistics-charts';

export const dynamic = 'force-dynamic';

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
    const session = await getAdminSession();
    if (!session) {
        return notFound();
    }

    const { period = '30' } = await searchParams;
    const validatedPeriod = ['7', '30', 'all'].includes(period) ? (period as '7' | '30' | 'all') : '30';

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    const result = await AdminDataService.getDailyChartData(ctx, validatedPeriod);

    if (!result.success) {
        return (
            <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen">
                <AdminHeader
                    title="Статистика"
                    subtitle="Динамика роста и аналитика вовлеченности"
                />
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl shadow-sm text-sm font-bold flex items-center gap-2">
                    Ошибка загрузки статистики: {result.error?.message}
                </div>
            </div>
        );
    }

    const data = result.data;

    return (
        <div className="p-4 sm:p-8 space-y-8 bg-[#f8fafc] min-h-screen">
            <AdminHeader
                title="Статистика"
                subtitle="Динамика роста и аналитика вовлеченности"
            />
            
            <StatisticsCharts data={data} period={validatedPeriod} />
        </div>
    );
}
