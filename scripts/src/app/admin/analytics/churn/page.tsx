/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { AnalyticsService } from '@/services/users';
import { ChurnDashboard } from '@/components/admin/analytics/churn-dashboard';
import { GuaranteeParserTester } from '@/components/admin/analytics/guarantee-parser-tester';
import { TrendingDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChurnAnalyticsPage() {
    const data = await AnalyticsService.getChurnForecast(30);

    return (
        <div className="space-y-8 max-w-6xl pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-rose-100 rounded-xl">
                            <TrendingDown size={24} className="text-rose-500" />
                        </div>
                        Аналитика Оттока
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Прогноз окончания гарантийных периодов подписок на 30 дней.</p>
                </div>
            </div>

            <ChurnDashboard data={data} />

            <GuaranteeParserTester />
        </div>
    );
}
