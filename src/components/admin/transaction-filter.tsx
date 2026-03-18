'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { DatePicker } from '@/components/admin/ui/date-picker';

export function TransactionFilter({
  initialParams,
  projects = [],
  isGlobalAdmin = false
}: {
  initialParams: {
    userId?: string,
    projectId?: string,
    search?: string,
    type?: string,
    status?: string,
    minAmount?: string,
    maxAmount?: string,
    startDate?: string,
    endDate?: string
  },
  projects?: any[],
  isGlobalAdmin?: boolean
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    formData.forEach((value, key) => {
      if (value) params.set(key, value as string);
      else params.delete(key);
    });

    router.push(`/admin/finance?tab=transactions&${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/admin/finance?tab=transactions');
  };

  return (
    <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
      <input type="hidden" name="userId" defaultValue={initialParams.userId} />

      {initialParams.userId && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Фильтр по пользователю активен:</span>
          <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-blue-100">{initialParams.userId}</span>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('userId');
              router.push(`/admin/finance?tab=transactions&${params.toString()}`);
            }}
            className="ml-auto p-1 text-blue-400 hover:text-rose-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-widest text-[10px]">
          <Filter size={14} className="text-blue-500" />
          Фильтры реестра
        </div>
        <button
          type="button"
          onClick={clearFilters}
          className="text-[10px] font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 uppercase transition-colors"
        >
          <X size={12} /> Очистить
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Выбор проекта (для Global Admin) */}
        {isGlobalAdmin && (
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Проект</label>
            <select
              name="projectId"
              defaultValue={initialParams.projectId || ''}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">Все проекты</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Поиск и Юзер */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Поиск (ID, Почта, TG ID)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text" name="search" defaultValue={initialParams.search}
              placeholder="Введите данные..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            />
          </div>
        </div>

        {/* Тип и Статус */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Тип</label>
            <select name="type" defaultValue={initialParams.type || 'ALL'} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none">
              <option value="ALL">Все</option>
              <option value="DEPOSIT">Пополнение</option>
              <option value="WITHDRAWAL">Списание</option>
              <option value="ORDER_PAYMENT">Оплата заказа</option>
              <option value="NEW_ORDER">Новый заказ</option>
              <option value="ORDER_STATUS_CHANGE">Статус заказа</option>
              <option value="REFUND">Возврат</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Статус</label>
            <select name="status" defaultValue={initialParams.status || 'ALL'} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none">
              <option value="ALL">Все</option>
              <option value="COMPLETED">Выполнено</option>
              <option value="PENDING">Ожидание</option>
              <option value="ERROR">Ошибка</option>
            </select>
          </div>
        </div>

        {/* Сумма ОТ и ДО */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Сумма от</label>
            <input type="number" name="minAmount" defaultValue={initialParams.minAmount} placeholder="0₽" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Сумма до</label>
            <input type="number" name="maxAmount" defaultValue={initialParams.maxAmount} placeholder="999к₽" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" />
          </div>
        </div>

        {/* Дата С и ПО */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Дата с</label>
            <DatePicker
              value={initialParams.startDate ? new Date(initialParams.startDate) : undefined}
              onChange={(date) => {
                const params = new URLSearchParams(searchParams.toString());
                if (date) params.set('startDate', date.toISOString().split('T')[0]);
                else params.delete('startDate');
                router.push(`/admin/finance?tab=transactions&${params.toString()}`);
              }}
              placeholder="С..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Дата по</label>
            <DatePicker
              value={initialParams.endDate ? new Date(initialParams.endDate) : undefined}
              onChange={(date) => {
                const params = new URLSearchParams(searchParams.toString());
                if (date) params.set('endDate', date.toISOString().split('T')[0]);
                else params.delete('endDate');
                router.push(`/admin/finance?tab=transactions&${params.toString()}`);
              }}
              placeholder="По..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-10 py-3 bg-slate-900 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          Применить фильтры
        </button>
      </div>
    </form>
  );
}


