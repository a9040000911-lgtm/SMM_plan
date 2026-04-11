/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Package,
  ExternalLink,
  Clock,
  Database,
  MessageSquare,
  Layers,
  Activity,
  Ticket,
  DollarSign,
  BarChart,
  Link as LinkIcon,
  ChevronDown,
  CheckCircle,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { formatAmount } from '@/utils/formatter';
import { OrderActions } from '@/components/admin/orders/order-actions';
import { getOrderStatusLabel, getOrderStatusColor, getActivityLabel, translateProviderError } from '@/utils/order-utils';
import { DripForceRunButton } from '@/components/admin/orders/drip-force-run-button';
import { formatServiceId } from '@/utils/id-formatter';

export const dynamic = 'force-dynamic';

async function getOrder(id: string) {
  return await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: true,
      internalService: {
        include: { socialPlatform: true, serviceCategory: true }
      },
      subOrders: {
        include: { internalService: true }
      },
      parent: {
        include: { internalService: true }
      },
      supportTickets: true
    }
  });
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  const statusLabel = getOrderStatusLabel(order.status);
  const statusColor = getOrderStatusColor(order.status);
  
  // Progress Calculation
  const hasProgressData = order.initialCount !== null && order.remains !== null;
  const initial = order.initialCount || 0;
  const remains = order.remains || order.quantity;
  const targetTotal = initial + order.quantity;
  const currentCount = order.currentCount !== null ? order.currentCount : (initial + (order.quantity - remains));
  
  let progressPercentage = 0;
  if (hasProgressData && order.quantity > 0) {
     const completedQty = Math.max(0, currentCount - initial);
     progressPercentage = Math.min(100, Math.round((completedQty / order.quantity) * 100));
  }
  
  const platformSlug = order.internalService.socialPlatform?.slug?.toUpperCase() || 'OTHER';
  const categoryType = order.internalService.serviceCategory?.categoryType as any;

  return (
    <div className="space-y-8 max-w-[1400px]">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Заказ #{order.id}</h2>
              <span
                className="text-xs font-bold uppercase px-3 py-1 rounded-lg border-2 shadow-sm"
                style={{
                  backgroundColor: `${statusColor}08`,
                  color: statusColor,
                  borderColor: `${statusColor}15`
                }}
              >
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-medium">
              <Clock size={14} className="text-slate-400" />
              Создан: <span className="font-mono text-slate-600">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <OrderActions orderId={order.id} status={order.status} />
        </div>
      </div>

      {/* METRICS HERO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Financials */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
              <DollarSign size={20} />
            </div>
            {Number(order.refundedAmount) > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Возвращено {formatAmount(order.refundedAmount)}₽</span>
            )}
            {Number(order.discountAmount) > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Скидка {formatAmount(order.discountAmount)}₽</span>
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Стоимость заказа</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{formatAmount(order.totalPrice)} ₽</div>
          </div>
        </div>

        {/* Metric 2: Quantity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
              <Package size={20} />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Объем / Количество</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
              {order.quantity.toLocaleString()} <span className="text-sm font-bold text-slate-500 uppercase">ед.</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Fulfillment Progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-2 z-10 relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
              <BarChart size={20} />
            </div>
            {hasProgressData ? (
               <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">API Stats</span>
            ) : (
               <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">N/A</span>
            )}
          </div>
          <div className="z-10 relative">
            <div className="flex items-center justify-between">
               <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Прогресс</div>
               <div className="text-xs font-black text-indigo-600">{progressPercentage}%</div>
            </div>
            
            <div className="w-full h-2.5 bg-slate-100 rounded-full mt-2 overflow-hidden shadow-inner">
               <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            
            {hasProgressData ? (
               <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                 <span>Старт: {initial}</span>
                 <span>Осталось: {remains}</span>
               </div>
            ) : (
               <div className="text-[10px] font-medium text-slate-400 mt-2 italic shadow-none">Счетчики не переданы провайдером</div>
            )}
          </div>
        </div>

        {/* Metric 4: Service Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
               <Activity size={20} />
            </div>
            <div className="text-right">
               <div className="text-[10px] font-black uppercase text-slate-800 tracking-tighter">{platformSlug}</div>
               <div className="text-[9px] font-bold uppercase text-slate-500">{getActivityLabel(categoryType)}</div>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Внутренний тариф</div>
            <div className="text-sm font-bold text-slate-900 mt-1 pb-1 leading-tight line-clamp-2" title={order.internalService.name}>
               {order.internalService.name}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">ID: {formatServiceId(platformSlug, categoryType, parseInt(order.internalServiceId))}</div>
          </div>
        </div>
      </div>

      {/* MAIN BENTO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: FULFILLMENT & LOGIC (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Target Link Focus Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-4">
             <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
               <LinkIcon size={24} />
             </div>
             <div className="flex-1 min-w-0 w-full text-center sm:text-left">
               <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ссылка на объект / Target</div>
               <a href={order.link} target="_blank" rel="noreferrer" className="text-base sm:text-lg font-bold text-blue-600 hover:text-blue-700 hover:underline break-all block leading-tight">
                 {order.link}
               </a>
             </div>
             <a href={order.link} target="_blank" rel="noreferrer" className="shrink-0 p-3 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm">
                <ExternalLink size={18} />
             </a>
          </div>

          {/* Provider Execution Engine */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[11px]">
                  <Database size={16} className="text-slate-500" />
                  Модуль Провайдера
                </h3>
                {order.externalId ? (
                   <span className="text-[10px] font-black bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-500 uppercase tracking-widest shadow-sm">
                     API-ID: {order.externalId}
                   </span>
                ) : (
                   <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-1 rounded-md">Отправка...</span>
                )}
             </div>
             
             <div className="p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                   <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <Database size={20} />
                   </div>
                   <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Используемый API Провайдер</div>
                      <div className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                        {order.providerName || 'N/A'}
                        {order.providerName && <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200 opacity-80"></span>}
                      </div>
                   </div>
                </div>

                {/* System Feedback Alert */}
                {(order.providerRawResponse || order.status === 'CANCELED') && (
                  <div className="space-y-2 mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span>Системный ответ</span>
                      <div className="h-px bg-slate-100 flex-1"></div>
                    </label>
                    <div className={`text-sm font-bold p-4 rounded-xl border shadow-sm ${order.status === 'CANCELED' ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-100' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                      {(() => {
                        const raw = order.providerRawResponse as any;
                        const directMsg = raw?.error || raw?.message || raw?.status;
                        const nestedMsg = raw?.lastProviderResponse?.error || raw?.lastProviderResponse?.message;
                        const errorText = nestedMsg || directMsg;
                        return errorText ? translateProviderError(errorText) : 'Выполняется штатно. Нет комментариев об ошибках.';
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Collapsible Raw Logs */}
                <details className="group border border-slate-200 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white shadow-sm">
                  <summary className="flex items-center justify-between p-4 cursor-pointer bg-slate-50/80 hover:bg-slate-100 transition-colors select-none text-slate-700">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-slate-400" />
                      <span className="font-bold text-[11px] uppercase tracking-widest">Tech Logs (Сырые ответы API)</span>
                    </div>
                    <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                  </summary>
                  <div className="p-0 bg-slate-900 border-t border-slate-200">
                    <pre className="text-[11px] sm:text-xs text-blue-300 font-mono leading-relaxed overflow-x-auto p-6">
                      {order.providerRawResponse
                        ? JSON.stringify(order.providerRawResponse, null, 2)
                        : '// Нет сохраненных Raw-данных от провайдера'}
                    </pre>
                  </div>
                </details>
             </div>
          </div>

          {/* Drip Feed Engine Block */}
          {order.isDripFeed && (
            <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="p-5 border-b border-purple-100 bg-purple-50/50 flex justify-between items-center relative z-10">
                <h3 className="font-bold text-purple-900 flex items-center gap-2 uppercase tracking-widest text-[11px]">
                  💧 Drip Feed Schedule
                </h3>
              </div>
              <div className="p-6 relative z-10 flex flex-col md:flex-row gap-6 items-center">
                
                <div className="flex-1 flex gap-6 w-full md:w-auto">
                    <div className="flex-1 bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Выполнено запусков</div>
                        <div className="text-2xl font-black text-purple-700 flex items-baseline gap-1">
                            {order.currentRun} <span className="text-sm text-purple-400">/ {order.runs}</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Интервал паузы</div>
                        <div className="text-xl font-bold text-purple-700 mt-1">{order.interval} мин.</div>
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-4 w-full md:w-auto p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                   <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={12}/> Следующий старт</div>
                        <div className="text-sm font-bold text-blue-600">
                          {order.nextRunAt ? new Date(order.nextRunAt).toLocaleString() : 'Не запланирован'}
                        </div>
                   </div>
                   <DripForceRunButton orderId={order.id} />
                </div>
              </div>
            </div>
          )}

          {/* Bundle Items Module */}
          {order.subOrders && order.subOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-blue-100 bg-blue-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[11px]">
                  <Layers size={16} className="text-blue-500" />
                  Состав пакета услуг
                </h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest">
                  {order.subOrders.length} Дочерних заказов
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {order.subOrders.map((sub: any) => (
                  <Link
                    key={sub.id}
                    href={`/admin/orders/${sub.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-blue-50 transition-colors group gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-500 transition-colors shadow-sm">
                        <Package size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{sub.internalService?.name || 'Unknown Service'}</div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Кол-во: {sub.quantity.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className="text-[10px] font-bold uppercase px-3 py-1 rounded-md border shadow-sm"
                        style={{
                          backgroundColor: `${getOrderStatusColor(sub.status)}10`,
                          color: getOrderStatusColor(sub.status),
                          borderColor: `${getOrderStatusColor(sub.status)}25`
                        }}
                      >
                        {getOrderStatusLabel(sub.status)}
                      </span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <ArrowLeft size={16} className="rotate-180" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Child Backlink Modue */}
          {order.parentId && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-500 shadow-sm">
                   <Layers size={20} />
                </div>
                <div>
                   <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">Часть пакета</div>
                   <div className="text-sm font-bold text-amber-900">
                      Основная услуга: {order.parent?.internalService?.name || 'Папка'}
                   </div>
                </div>
              </div>
              <Link
                  href={`/admin/orders/${order.parentId}`}
                  className="px-4 py-2 bg-white text-amber-600 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 hover:border-amber-300 transition-colors shadow-sm flex items-center gap-2"
                >
                  Перейти в корень
                  <ArrowLeft size={16} className="rotate-180" />
              </Link>
            </div>
          )}
          
          {/* User Comments Block */}
          {order.comments && (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <MessageSquare size={16} className="text-slate-400" />
                    <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[11px]">Пользовательский комментарий</h3>
                 </div>
                 <div className="p-6 text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap italic opacity-90">
                    "{order.comments}"
                 </div>
             </div>
          )}

        </div>

        {/* RIGHT COLUMN: SIDEBAR (1/3) */}
        <div className="space-y-6">
          
          {/* Client Insight Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-900 relative">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
             </div>
             
             <div className="px-6 pb-6 text-center relative -mt-12">
               {/* Avatar */}
               <div className="w-24 h-24 mx-auto rounded-2xl bg-white p-1.5 shadow-md">
                 <div className="w-full h-full bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-3xl font-black uppercase">
                   {(order.user.username || 'U').substring(0, 2)}
                 </div>
               </div>
               
               <h4 className="text-xl font-black text-slate-800 mt-4 leading-tight">@{order.user.username || 'unknown'}</h4>
               <p className="text-[10px] text-slate-400 font-mono mt-1 break-all px-4">{order.user.id}</p>
               
               <div className="grid grid-cols-2 gap-px bg-slate-100 mt-6 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                 <div className="bg-white p-4 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Баланс</div>
                    <div className="text-sm font-black text-slate-800">{formatAmount(order.user.balance)}₽</div>
                 </div>
                 <div className="bg-white p-4 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Траты</div>
                    <div className="text-sm font-black text-slate-800">{formatAmount(order.user.spent)}₽</div>
                 </div>
               </div>

               <Link
                href={`/admin/users/${order.userId}`}
                className="mt-4 w-full flex justify-center items-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
               >
                 <User size={16} />
                 Профиль клиента
               </Link>
             </div>
          </div>

          {/* Connected Support Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
                <h4 className="font-bold text-slate-700 uppercase tracking-widest text-[11px] flex items-center gap-2">
                   <Ticket size={16} className="text-slate-400" />
                   Связанные тикеты
                </h4>
                <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-600">
                   {order.supportTickets?.length || 0}
                </div>
             </div>
             
             {order.supportTickets && order.supportTickets.length > 0 ? (
                <div className="divide-y divide-slate-100">
                   {order.supportTickets.map(ticket => (
                      <Link key={ticket.id} href={`/admin/support?ticket=${ticket.id}`} className="block p-4 hover:bg-slate-50 transition-colors group">
                         <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-blue-500">#{ticket.id.slice(0, 8)}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${ticket.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                               {ticket.status}
                            </span>
                         </div>
                         <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                            {ticket.subject}
                         </div>
                      </Link>
                   ))}
                </div>
             ) : (
                <div className="p-6 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                   <CheckCircle size={24} className="text-emerald-400 opacity-50" />
                   <div className="text-[11px] uppercase tracking-widest font-bold mt-1">Жалоб не поступало</div>
                </div>
             )}
          </div>

          {/* Timeline Node Base */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-5">
             <h4 className="font-bold text-slate-700 uppercase tracking-widest text-[11px] flex items-center gap-2 mb-2 border-b border-slate-100 pb-4">
                <Calendar size={16} className="text-slate-400" />
                Audit Timeline
             </h4>
             
             <div className="relative pl-6 space-y-6">
                {/* Connector line */}
                <div className="absolute top-2 bottom-3 left-[9px] w-[2px] bg-slate-100 rounded-full"></div>

                <div className="relative">
                   <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-500 z-10 flex items-center justify-center"></div>
                   <div>
                       <div className="text-xs font-bold text-slate-800 tracking-tight">Заказ Создан Системой</div>
                       <div className="text-[10px] text-slate-400 font-mono mt-0.5" suppressHydrationWarning>{new Date(order.createdAt).toLocaleString()}</div>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 z-10"></div>
                   <div>
                       <div className="text-xs font-bold text-slate-800 tracking-tight">Последняя активность</div>
                       <div className="text-[10px] text-slate-400 font-mono mt-0.5" suppressHydrationWarning>{new Date(order.updatedAt).toLocaleString()}</div>
                   </div>
                </div>
                
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}