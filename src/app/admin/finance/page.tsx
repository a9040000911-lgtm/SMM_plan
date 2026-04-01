/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, FileDown } from 'lucide-react';
import { AdminTabs } from '@/components/admin/core/admin-tabs';

import TransactionsPage from '../transactions/page';
import ExpensesPage from '../expenses/page';
import ReportsPage from '../analytics/reports/page';

import { FinanceSummary } from '@/components/admin/finance/finance-summary';

export const dynamic = 'force-dynamic';

export default async function FinancePage(props: { searchParams: Promise<any> }) {
    const tabs = [
        { label: 'Транзакции', icon: <ArrowLeftRight size={16} />, id: 'transactions' },
        { label: 'Расходы (Бизнес)', icon: <TrendingDown size={16} />, id: 'expenses' },
        { label: 'Отчеты и Экспорт', icon: <FileDown size={16} />, id: 'reports' },
    ];

    const searchParams = await props.searchParams;
    const activeTab = searchParams.tab || 'transactions';

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 w-full overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-slate-100 rounded-md">
                            <TrendingUp size={24} className="text-emerald-600" />
                        </div>
                        Финансы и Отчетность
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Управление денежными потоками, расходами и аналитика.</p>
                </div>
            </div>

            <FinanceSummary />

            <AdminTabs tabs={tabs}>
                {activeTab === 'transactions' ? <div><TransactionsPage searchParams={searchParams} /></div> : <div />}
                {activeTab === 'expenses' ? <div><ExpensesPage /></div> : <div />}
                {activeTab === 'reports' ? <div><ReportsPage /></div> : <div />}
            </AdminTabs>
        </div>
    );
}


