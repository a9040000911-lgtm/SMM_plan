/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { notFound } from 'next/navigation';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Landmark,
  Building2,
  AlertTriangle,
  ExternalLink,
  Activity
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import { getAdminSession } from '@/utils/admin-session';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { AdminTableCard } from '@/components/admin/core/admin-table-card';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TreasuryPage() {
  const session = await getAdminSession();
  if (!session || !session.isGlobalAdmin) {
      notFound();
  }

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.getTreasuryData(ctx);

  if (!result.success) {
    return <div className="p-8 text-red-500">Ошибка: {result.error?.message}</div>;
  }

  const { totalUserBalanceRUB, providersAssetsRUB, providerDetails, dailyRevenue, dailyCost, failoverLeakage = 0 } = result.data;
  
  // Delta logic
  const delta = providersAssetsRUB - totalUserBalanceRUB;
  const coverageRatio = totalUserBalanceRUB > 0 ? (providersAssetsRUB / totalUserBalanceRUB) * 100 : 100;
  
  let healthColor = 'bg-emerald-500';
  if (coverageRatio < 80) healthColor = 'bg-rose-500';
  else if (coverageRatio < 100) healthColor = 'bg-amber-500';

  const dailyMargin = dailyRevenue - dailyCost;
  const marginPercent = dailyRevenue > 0 ? (dailyMargin / dailyRevenue) * 100 : 0;

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[#f8fafc] min-h-screen max-w-7xl mx-auto">
      <AdminHeader
        title="Казначейство"
        subtitle="Прогнозирование ликвидности и финансовый анализ"
      />

      {/* Margin Health Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
         <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Индикатор покрытия (Margin Health Bar)</h3>
            <span className="text-xs font-bold text-slate-600">{coverageRatio.toFixed(1)}%</span>
         </div>
         <div className="h-4 bg-slate-100 rounded-full w-full overflow-hidden relative">
            <div 
               className={`h-full ${healthColor} transition-all duration-1000 ease-out flex items-center justify-end pr-2`} 
               style={{ width: `${Math.min(coverageRatio, 200)}%` }}
            >
               {coverageRatio > 20 && <span className="text-[8px] font-black text-white mix-blend-overlay">Safe Zone</span>}
            </div>
            {/* 100% Marker */}
            <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-slate-400 z-10" title="100% Покрытие"></div>
         </div>
         <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2 uppercase">
            <span>Кассовый разрыв</span>
            <span>Идеальное покрытие (100%)</span>
            <span>Профицит (200%+)</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* АКТИВЫ (ASSETS) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-indigo-500 mb-4 relative z-10">
             <Landmark size={20} />
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Активы (Провайдеры)</div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tighter relative z-10">
             {formatAmount(providersAssetsRUB)} ₽
          </div>
        </div>

        {/* ОБЯЗАТЕЛЬСТВА (LIABILITIES) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-rose-500 mb-4 relative z-10">
             <Wallet size={20} />
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Обязательства (Юзеры)</div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tighter relative z-10">
             {formatAmount(totalUserBalanceRUB)} ₽
          </div>
        </div>

        {/* ДЕЛЬТА (NET DELTA) */}
        <div className={`md:col-span-2 rounded-2xl border shadow-sm p-6 space-y-2 flex flex-col justify-center ${coverageRatio >= 100 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className={`flex items-center justify-between mb-4 ${coverageRatio >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
             <div className="flex items-center gap-2">
                 {coverageRatio >= 100 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                 <div className={`text-[10px] font-black uppercase tracking-widest ${coverageRatio >= 100 ? 'text-emerald-600' : 'text-rose-600'}`}>Кассовая устойчивость</div>
             </div>
             {coverageRatio < 100 && <AlertTriangle size={16} className="animate-pulse" />}
          </div>
          <div className={`text-3xl font-black tracking-tighter ${coverageRatio >= 100 ? 'text-emerald-700' : 'text-rose-700'}`}>
             {delta > 0 ? '+' : ''}{formatAmount(delta)} ₽
          </div>
        </div>
      </div>

      {/* Revenue Flow Widget */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-center gap-2 text-blue-400 mb-6 relative z-10">
             <Activity size={20} />
             <div className="text-[10px] font-black uppercase tracking-widest">Движение средств (24 часа)</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 divide-x divide-slate-800 relative z-10">
              <div className="px-4 text-center md:text-left">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Оборот</div>
                  <div className="text-2xl font-black text-emerald-400">+{formatAmount(dailyRevenue)} ₽</div>
              </div>
              <div className="px-4 text-center md:text-left text-slate-300">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Себестоимость API</div>
                  <div className="text-2xl font-black text-rose-400">-{formatAmount(dailyCost - failoverLeakage)} ₽</div>
              </div>
              <div className="px-4 text-center md:text-left text-slate-300">
                  <div className="flex items-center justify-center md:justify-start gap-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Скрытые Потери</div>
                      {failoverLeakage > 0 && <AlertTriangle size={12} className="text-amber-500 animate-pulse mb-1" />}
                  </div>
                  <div className={`text-2xl font-black ${failoverLeakage > 0 ? 'text-amber-400' : 'text-slate-500'}`}>-{formatAmount(failoverLeakage)} ₽</div>
              </div>
              <div className="px-4 text-center md:text-left">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 items-center justify-center md:justify-start flex gap-2">
                      Чистая Маржа
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${marginPercent >= 30 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{marginPercent.toFixed(1)}%</span>
                  </div>
                  <div className="text-2xl font-black text-white">{formatAmount(dailyMargin)} ₽</div>
              </div>
          </div>
      </div>

      <AdminTableCard title="Распределение активов по провайдерам" icon={Building2}>
         <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Провайдер</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Эквивалент ₽</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Статус</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px]">
              {providerDetails.sort((a,b) => b.convertedRUB - a.convertedRUB).map((p) => {
                const isRisk = p.convertedRUB < 500;
                
                return (
                  <tr key={p.id} className={`transition-colors ${isRisk ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatAmount(p.latestBalance)} {p.currency}</div>
                    </td>
                    <td className={`px-6 py-4 font-black tracking-tighter text-right text-lg ${isRisk ? 'text-rose-600' : 'text-slate-800'}`}>
                       {formatAmount(p.convertedRUB)} ₽
                    </td>
                    <td className="px-6 py-4 text-center">
                        {isRisk ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded animate-pulse">
                                <AlertTriangle size={12} /> Низкий баланс
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-100">
                                В норме
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <Link 
                            href={`/admin/providers/${p.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors"
                        >
                            Открыть <ExternalLink size={12} />
                        </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
         </div>
      </AdminTableCard>
    </div>
  );
}
