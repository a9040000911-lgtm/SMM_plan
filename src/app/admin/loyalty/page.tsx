/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { getAdminSession, getActiveProjectId } from '@/utils/admin-session';
import { redirect } from 'next/navigation';
import {
    Trophy,
    Gift,
    TrendingUp,
    Users
} from 'lucide-react';
import { LoyaltyForm } from '@/components/admin/users/loyalty-form';
// Optional: import { useLanguage } from '@/providers/language-provider'; -> We can't use Client hooks here. 
// We will hardcode translations as it's an admin panel or use a server-side translation fetch if available.
// Smmplan usually hardcodes admin panel rus.

export const dynamic = 'force-dynamic';

export default async function LoyaltyBuilderPage() {
    const session = await getAdminSession();
    if (!session) {
        redirect('/admin/login');
    }

    const projectId = await getActiveProjectId();
    const whereProjectId = projectId === 'all' ? undefined : projectId;

    // Fetch Stats
    const [projectRaw, turnoverAgg, clientsAgg, bonusesAgg] = await Promise.all([
        projectId === 'all' ? null : prisma.project.findUnique({ where: { id: projectId! } }),
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                projectId: whereProjectId,
                status: 'COMPLETED',
                type: 'DEPOSIT'
            }
        }),
        prisma.user.aggregate({
            _count: { id: true },
            where: {
                projectId: whereProjectId
            }
        }),
        prisma.loyaltyLog.aggregate({
            _sum: { value: true },
            _count: { id: true },
            where: {
                projectId: whereProjectId
            }
        })
    ]);

    // Parse the JSON configuration safely
    let levels = [];
    let rules = [];

    if (projectRaw?.config) {
        const config = projectRaw.config as any;
        if (config?.loyaltyScheme?.levels) levels = config.loyaltyScheme.levels;
        if (config?.loyaltyScheme?.rules) rules = config.loyaltyScheme.rules;
    }

    const totalTurnover = turnoverAgg._sum.amount ? turnoverAgg._sum.amount.toNumber() : 0;
    const totalClients = clientsAgg._count.id || 0;
    const totalBonusesValue = bonusesAgg._sum.value ? bonusesAgg._sum.value.toNumber() : 0;
    const totalBonusesCount = bonusesAgg._count.id || 0;

    return (
        <div className="space-y-8 max-w-6xl pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <Trophy size={24} className="text-amber-500" />
                        </div>
                        Конструктор лояльности
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Определите правила начисления бонусов за пополнения баланса</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <TrendingUp size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Оборот проекта</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{totalTurnover.toLocaleString()}₽</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Users size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Клиентов</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{totalClients}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                            <Gift size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Выдано бонусов</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">
                        {totalBonusesValue.toLocaleString()}₽
                        <span className="text-sm font-medium text-slate-400 ml-2">({totalBonusesCount})</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Trophy size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Активных правил</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{rules.length}</div>
                </div>
            </div>

            <LoyaltyForm initialLevels={levels} initialRules={rules} />
        </div>
    );
}
