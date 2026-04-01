'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import useSWR from 'swr';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  MessageSquare,
  ShieldAlert,
  Loader2,
  Clock,
  CreditCard,
  ChevronRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import Link from 'next/link';
import { cn } from '@/utils/ui';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { CopyButton } from '@/components/admin/core/copy-button';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
  const { data: stats, error, isLoading } = useSWR('/api/admin/stats', fetcher, {
    refreshInterval: 30000,
  });

  if (error) return <div className="p-8 text-rose-500 text-center uppercase font-bold">Ошибка загрузки данных</div>;
  if (isLoading || !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-400 text-sm font-medium">Загрузка статистики...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <AdminHeader
        title="Дашборд"
        subtitle="Сводная активность и ключевые метрики платформы"
      />
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-wider">Система онлайн</span>
        </div>
      </div>

      {/* KPI Cards - Simple Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/admin/finance" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TrendingUp size={24} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Выручка</div>
          <div className="text-2xl font-bold text-slate-900">{formatAmount(stats.revenue)}₽</div>
        </Link>

                <Link href="/admin/orders" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ShoppingCart size={24} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Заказы</div>
          <div className="text-2xl font-bold text-slate-900">{stats.orderCount}</div>
        </Link>

                <Link href="/admin/users" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Клиенты</div>
          <div className="text-2xl font-bold text-slate-900">{stats.userCount ?? 0}</div>
        </Link>

                <Link href="/admin/support" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <MessageSquare size={24} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Репорт</div>
          <div className="text-2xl font-bold text-slate-900">{stats.openTicketsCount || 0} тикетов</div>
        </Link>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Последние заказы</h3>
            <Link href="/admin/orders" className="text-xs font-bold text-blue-600 hover:underline">Все заказы</Link>
          </div>
          <div className="divide-y divide-slate-100 overflow-auto max-h-[500px]">
            {(stats.latestOrders || []).map((order: any) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                    {(order.user?.username || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{order.internalService?.name}</h4>
                      {order.isDripFeed && (
                        <span title="Drip-feed order">
                          <Clock size={12} className="text-blue-500 animate-pulse" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-slate-500 font-medium">@{order.user?.username}</p>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <p className="text-[10px] text-slate-900 font-bold">{formatAmount(order.totalPrice)}₽</p>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <p className="text-[10px] text-slate-500 font-bold">{order.quantity} шт.</p>
                      {order.providerName && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <p className="text-[9px] text-slate-400 font-bold tracking-tighter uppercase">{order.providerName}</p>
                        </>
                      )}
                      {order.status !== 'COMPLETED' && order.remains > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <p className="text-[10px] text-indigo-500 font-black italic">Осталось: {order.remains}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right flex flex-col items-end">
                    <div className={cn(
                      "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter mb-1",
                      order.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        order.status === 'CANCELED' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                          order.status === 'PROCESSING' || order.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                            "bg-slate-50 text-slate-500 border border-slate-100"
                    )}>
                      {
                        (({
                          'PENDING': 'Ожидает',
                          'PROCESSING': 'В обработке',
                          'IN_PROGRESS': 'Выполняется',
                          'COMPLETED': 'Завершён',
                          'PARTIAL': 'Частично',
                          'CANCELED': 'Отменён',
                          'ERROR': 'Ошибка'
                        } as Record<string, string>)[order.status] ?? order.status)
                      }
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono tracking-tighter">
                      <span>#{order.id}</span>
                      <CopyButton value={String(order.id)} label="ID заказа" />
                      <span>• {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={order.link} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 text-slate-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all">
                      <ExternalLink size={14} />
                    </a>
                    <Link href={`/admin/orders/${order.id}`} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white rounded-xl transition-all">
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {(!stats.latestOrders || stats.latestOrders.length === 0) && (
              <div className="p-12 text-center text-slate-400 italic text-sm">Заказов пока нет</div>
            )}
          </div>
        </div>

        {/* System Stats / Incident Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Статус системы</h3>
          </div>
          <div className="p-6 space-y-6">
            <Link href="/admin/orders?status=STUCK" className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Зависшие заказы</div>
                  <div className="text-[10px] text-slate-500">Требуют внимания</div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm font-bold ${stats.stuckOrdersCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                {stats.stuckOrdersCount || 0}
              </div>
            </Link>

            <Link href="/admin/transactions" className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Ожидают оплаты</div>
                  <div className="text-[10px] text-slate-500">Транзакции в процессе</div>
                </div>
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-sm font-bold">
                {stats.pendingPaymentsCount || 0}
              </div>
            </Link>

            {/* Pricing Abuse Alert */}
            {stats.pricingAnalytics?.stats?.abuse > 0 && (
              <div className="flex items-center justify-between bg-rose-50/50 p-2 rounded-xl border border-rose-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Price Abuse</div>
                    <div className="text-[10px] text-rose-600 font-bold uppercase tracking-tighter">Наценка {'>'} 15000%!</div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-lg bg-rose-600 text-white text-sm font-black animate-pulse">
                  {stats.pricingAnalytics.stats.abuse}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Уведомления</div>
              <div className="space-y-3">
                {stats.stuckOrdersCount > 0 && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3">
                    <ShieldAlert size={14} className="text-orange-600 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-orange-800 leading-tight">Обнаружены зависшие заказы ({stats.stuckOrdersCount} шт). Рекомендуется проверить провайдеров.</span>
                  </div>
                )}

                {stats.pricingAnalytics?.stats?.abuse > 0 && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
                    <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-rose-800 leading-tight">
                      <b>ВНИМАНИЕ:</b> Обнаружено {stats.pricingAnalytics.stats.abuse} услуг с критической наценкой ({'>'}15000%). Проверьте лимиты в разделе Сервисы.
                    </span>
                  </div>
                )}

                {stats.stuckOrdersCount === 0 && (!stats.pricingAnalytics || stats.pricingAnalytics.stats.abuse === 0) && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-blue-800 leading-tight">Система работает в штатном режиме. Ошибок не зафиксировано.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ size, className }: { size: number, className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}


