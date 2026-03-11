'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useEffect, useState, useCallback } from 'react';
import { getAdminLogsAction } from './actions';
import { History, Filter, Calendar as CalendarIcon, RefreshCw, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DatePicker } from '@/components/admin/ui/date-picker';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    adminId: '',
    action: '',
    dateFrom: '',
    dateTo: ''
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminLogsAction(page, filters);
      if (res.success) {
        setLogs(res.logs || []);
        setTotalPages(res.pages || 1);
        setTotal(res.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({ adminId: '', action: '', dateFrom: '', dateTo: '' });
    setPage(1);
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      ADJUST_BALANCE: 'bg-rose-100 text-rose-800 border-rose-200',
      UPDATE_PROVIDER: 'bg-amber-100 text-amber-800 border-amber-200',
      ADD_PROVIDER_FUNDS: 'bg-blue-100 text-blue-800 border-blue-200',
      UPDATE_STAFF_ACCESS: 'bg-purple-100 text-purple-800 border-purple-200',
      LOGIN: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${styles[action] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <History className="text-blue-600" size={32} />
            Журнал действий
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Аудит активности администраторов и модераторов</p>
        </div>
        <button onClick={loadLogs} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 ml-1">
            <Filter size={10} /> Действие
          </label>
          <select
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="">Все действия</option>
            <option value="ADJUST_BALANCE">Изменение баланса</option>
            <option value="UPDATE_PROVIDER">Настройка провайдера</option>
            <option value="ADD_PROVIDER_FUNDS">Пополнение провайдера</option>
            <option value="UPDATE_STAFF_ACCESS">Доступы сотрудников</option>
            <option value="LOGIN">Вход в систему</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 ml-1">
            <CalendarIcon size={10} /> От
          </label>
          <DatePicker
            value={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
            onChange={(date) => {
              setFilters(prev => ({ ...prev, dateFrom: date ? date.toISOString().split('T')[0] : '' }));
              setPage(1);
            }}
            placeholder="С..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 ml-1">
            <CalendarIcon size={10} /> До
          </label>
          <DatePicker
            value={filters.dateTo ? new Date(filters.dateTo) : undefined}
            onChange={(date) => {
              setFilters(prev => ({ ...prev, dateTo: date ? date.toISOString().split('T')[0] : '' }));
              setPage(1);
            }}
            placeholder="По..."
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-rose-600 transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Дата и время</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Админ</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Действие</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Объект</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Подробности</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400">Загрузка данных...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400">Событий не найдено</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-400">
                      {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {log.admin?.username?.substring(0, 2).toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-bold text-slate-900">@{log.admin?.username || 'unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] text-slate-400">
                      {log.targetId || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 max-w-md">
                        <Info size={14} className="mt-0.5 text-slate-300 flex-shrink-0" />
                        <span className="text-xs text-slate-600 font-medium leading-relaxed">
                          {log.details}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Всего событий: {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-white rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-4 text-xs font-black text-slate-600">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-white rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
