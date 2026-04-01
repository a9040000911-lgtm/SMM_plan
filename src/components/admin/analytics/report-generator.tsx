'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import {
  FileDown,
  Loader2,
  Calendar,
  ArrowRight,
  CreditCard,
  ShoppingCart,
  Users as UsersIcon,
  BarChart3
} from 'lucide-react';
import {
  exportTransactionsReport,
  exportOrdersReport,
  exportUsersReport,
  exportProfitLossReport
} from '@/app/admin/analytics/reports/actions';

import { DatePicker } from '@/components/admin/ui/date-picker';

export function ReportGenerator() {
  const [loading, setLoading] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const downloadFile = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (type: string) => {
    setLoading(type);
    try {
      let data = '';
      if (type === 'finance') data = await exportTransactionsReport(startDate, endDate);
      if (type === 'orders') data = await exportOrdersReport(startDate, endDate);
      if (type === 'users') data = await exportUsersReport();
      if (type === 'pl') data = await exportProfitLossReport(startDate, endDate);

      downloadFile(data, `report_${type}`);
    } catch (e) {
      alert('Ошибка: ' + (e as any).message);
    } finally {
      setLoading(null);
    }
  };

  const reportTypes = [
    {
      id: 'pl',
      name: 'P&L Аналитика',
      desc: 'Чистая прибыль с учетом всех расходов (ЗП, Маркетинг, Налоги).',
      icon: BarChart3,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      premium: true
    },
    {
      id: 'orders',
      name: 'Отчет по продажам',
      desc: 'Детальный список заказов и валовая прибыль.',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      id: 'finance',
      name: 'Финансовый реестр',
      desc: 'Все движения средств по кошелькам пользователей.',
      icon: CreditCard,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      id: 'users',
      name: 'База клиентов',
      desc: 'Полный список пользователей и их ценность (LTV).',
      icon: UsersIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      noDates: true
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-wrap items-end gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Calendar size={14} className="text-blue-500" />
            Начальная дата
          </label>
          <DatePicker
            value={new Date(startDate)}
            onChange={(date) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
            placeholder="С..."
          />
        </div>
        <div className="p-3 mb-1 text-slate-300">
          <ArrowRight size={20} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Calendar size={14} className="text-blue-500" />
            Конечная дата
          </label>
          <DatePicker
            value={new Date(endDate)}
            onChange={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
            placeholder="По..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-[13px]">
        {reportTypes.map((r) => {
          const Icon = r.icon;
          const isBusy = loading === r.id;

          return (
            <div key={r.id} className={`bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group ${r.premium ? 'border-amber-200 ring-4 ring-amber-50' : 'border-slate-200'}`}>
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl ${r.bg} ${r.color} flex items-center justify-center`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{r.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-medium">{r.desc}</p>
                </div>
              </div>

              <button
                onClick={() => handleExport(r.id)}
                disabled={!!loading}
                className={`mt-6 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${r.premium ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
              >
                {isBusy ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                Выгрузить
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


