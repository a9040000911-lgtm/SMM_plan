/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { TrendingUp, ReceiptText, TrendingDown, Landmark } from 'lucide-react';
import { FinanceSummary } from '@/components/admin/finance/finance-summary';
import { AdminTabs } from '@/components/admin/core/admin-tabs';
import { getAdminSession } from '@/utils/admin-session';

import TransactionsPage from '../transactions/page';
import ExpensesPage from '../expenses/page';
import TreasuryPage from './treasury/page';

export const dynamic = 'force-dynamic';

export default async function FinancePage(props: { searchParams: Promise<any> }) {
    const session = await getAdminSession();
    if (!session) return null;

    const isGlobalAdmin = session.isGlobalAdmin;

    const tabs = [
        { label: 'Сводка', icon: <TrendingUp size={16} />, id: 'overview', description: 'Обобщенные финансовые показатели' },
        { label: 'Транзакции', icon: <ReceiptText size={16} />, id: 'transactions', description: 'История пополнений, списаний и движение средств клиентов' },
        { label: 'Расходы', icon: <TrendingDown size={16} />, id: 'expenses', description: 'Учет операционных расходов' },
        ...(isGlobalAdmin ? [{ label: 'Казначейство', icon: <Landmark size={16} />, id: 'treasury', description: 'Анализ заблокированных средств и маржинальности' }] : [])
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-12 w-full overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                            <Landmark size={24} />
                        </div>
                        Управление Финансами
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Единый центр учета транзакций, расходов и статистики платформы.</p>
                </div>
            </div>

            <AdminTabs tabs={tabs}>
                <div className="animate-in fade-in duration-300">
                    <FinanceSummary />
                </div>
                <div className="animate-in fade-in duration-300">
                    <TransactionsPage searchParams={props.searchParams} />
                </div>
                <div className="animate-in fade-in duration-300 relative -top-6">
                    <ExpensesPage />
                </div>
                {isGlobalAdmin && (
                    <div className="animate-in fade-in duration-300 relative -top-6">
                        <TreasuryPage />
                    </div>
                )}
            </AdminTabs>
        </div>
    );
}
