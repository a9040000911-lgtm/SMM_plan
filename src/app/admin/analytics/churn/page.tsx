/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { notFound } from 'next/navigation';
import { 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Search
} from 'lucide-react';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ChurnPage() {
  const session = await getAdminSession();
  if (!session) return notFound();

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.getChurnStats(ctx);
  if (!result.success) {
    return <div className="p-8 text-red-500">Ошибка: {result.error.message}</div>;
  }

  const stats = result.data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingDown className="text-rose-500" />
            Аналитика оттока (Churn)
          </h2>
          <p className="text-sm text-slate-500 font-medium">Мониторинг списаний и рисков потери клиентов по гарантийным заказам.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={24} /></div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Критический риск</div>
              <div className="text-2xl font-black text-rose-600">{stats.atRiskCount}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Заказов, требующих немедленного пополнения (докрутки) из-за высокого темпа списаний.</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ShieldCheck size={24} /></div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Под защитой</div>
              <div className="text-2xl font-black text-slate-900">{stats.totalMonitoredOrders}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Всего активных заказов с гарантией, которые находятся под автоматическим мониторингом.</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><TrendingDown size={24} /></div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Средний отток</div>
              <div className="text-2xl font-black text-amber-600">{stats.avgDropoff}%</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Средний процент списаний по всем мониторящимся заказам за последние 48 часов.</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black mb-4 tracking-tight">Поиск проблемных заказов</h3>
          <p className="text-slate-400 mb-8 font-medium leading-relaxed">
            Система Churn Shield анализирует историю снапшотов каждого заказа. Если темп списаний превышает 10% в неделю — мы помечаем заказ как рискованный.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/admin/orders?status=COMPLETED&hasWarranty=true"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Search size={18} /> Перейти к заказам
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 flex items-center justify-center">
            <TrendingDown size={300} strokeWidth={1} />
        </div>
      </div>
    </div>
  );
}
