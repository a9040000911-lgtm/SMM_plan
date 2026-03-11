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
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { formatAmount } from '@/utils/formatter';
import { OrderActions } from '@/components/admin/orders/order-actions';
import { getOrderStatusLabel, getOrderStatusColor, getActivityLabel, translateProviderError } from '@/utils/order-utils';
import { DripForceRunButton } from '@/components/admin/orders/drip-force-run-button';

export const dynamic = 'force-dynamic';

async function getOrder(id: string) {
  return await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: true,
      internalService: true,
      subOrders: {
        include: { internalService: true }
      },
      parent: {
        include: { internalService: true }
      }
    }
  });
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  // statusMap больше не нужен локально
  const statusLabel = getOrderStatusLabel(order.status);
  const statusColor = getOrderStatusColor(order.status);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Заказ #{order.id}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: `${statusColor}15`,
                  color: statusColor,
                  borderColor: `${statusColor}30`
                }}
              >
                {statusLabel}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {order.id}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <OrderActions orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <Package size={18} className="text-blue-500" />
                Детали услуги
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ссылка объекта</label>
                <a href={order.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
                  {order.link}
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Внутренний тариф</label>
                <div className="text-sm font-bold text-slate-800">{order.internalService.name}</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                  <span className="text-blue-600">{order.internalService.platform}</span>
                  <span className="mx-1">•</span>
                  <span className="text-indigo-600">{getActivityLabel(order.internalService.category)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Заказанное количество</label>
                <div className="text-lg font-black text-slate-800 tracking-tighter">{order.quantity.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 uppercase">ед.</span></div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Провайдер & API</label>
                <div className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{order.providerName || 'N/A'}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold">
                    EXT-ID: {order.externalId || 'None'}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Цена продажи</label>
                <div className="text-lg font-black text-emerald-600 tracking-tighter">{formatAmount(order.totalPrice)}₽</div>
                {order.costPrice && (
                  <div className="mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase mr-2">Закупка:</span>
                    <span className="text-xs font-bold text-slate-500 font-mono italic">{formatAmount(order.costPrice)}₽</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BUNDLE COMPONENTS SECTION */}
          {(order as any).subOrders && (order as any).subOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-blue-100 bg-blue-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                  <Layers size={18} className="text-blue-500" />
                  Состав пакета (Дочерние заказы)
                </h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
                  {(order as any).subOrders.length} услуг
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {(order as any).subOrders.map((sub: any) => (
                  <Link
                    key={sub.id}
                    href={`/admin/orders/${sub.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <Package size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{sub.internalService?.name || 'Unknown Service'}</div>
                        <div className="text-[10px] text-slate-400">Кол-во: {sub.quantity.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: `${getOrderStatusColor(sub.status)}15`,
                          color: getOrderStatusColor(sub.status),
                          borderColor: `${getOrderStatusColor(sub.status)}30`
                        }}
                      >
                        {getOrderStatusLabel(sub.status)}
                      </span>
                      <Layers size={16} className="text-slate-300 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* PARENT ORDER LINK SECTION */}
          {(order as any).parentId && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-amber-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Layers size={14} />
                  </div>
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-tight">Это часть пакета услуг</div>
                </div>
                <Link
                  href={`/admin/orders/${(order as any).parentId}`}
                  className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                >
                  Перейти к основному заказу
                  <ExternalLink size={12} />
                </Link>
              </div>
              {(order as any).parent && (
                <div className="px-6 py-4 border-t border-amber-100 text-sm">
                  <span className="text-slate-500">Основная услуга: </span>
                  <span className="font-bold">{(order as any).parent.internalService?.name || 'Unknown'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DRIP FEED SECTION */}
        {(order as any).isDripFeed && (
          <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-purple-100 bg-purple-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                💧 Drip Feed Status
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">
                  {(order as any).currentRun} / {(order as any).runs} runs
                </span>
                {/* Force Run Component */}
                <DripForceRunButton orderId={order.id} />
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Интервал</div>
                <div className="font-bold">{(order as any).interval} мин.</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Следующий запуск</div>
                <div className="font-bold text-purple-600">
                  {(order as any).nextRunAt ? new Date((order as any).nextRunAt).toLocaleString() : 'Не запланирован'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Provider Status / Errors Block */}
        {(order.providerRawResponse || order.status === 'CANCELED') && (
          <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${order.status === 'CANCELED' ? 'border-rose-100' : 'border-slate-100'}`}>
            <div className={`p-6 border-b flex items-center justify-between ${order.status === 'CANCELED' ? 'bg-rose-50/50 border-rose-50' : 'bg-slate-50/50 border-slate-50'}`}>
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <Database size={18} className={order.status === 'CANCELED' ? 'text-rose-500' : 'text-slate-500'} />
                Статус исполнения у провайдера
              </h3>
              {order.externalId && (
                <span className="text-[9px] font-black bg-white px-2 py-1 rounded-lg border uppercase tracking-widest text-slate-400">
                  ID Провайдера: {order.externalId}
                </span>
              )}
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Комментарий провайдера</label>
                  <div className={`text-sm font-bold p-4 rounded-xl border ${order.status === 'CANCELED' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                    }`}>
                    {(() => {
                      const raw = order.providerRawResponse as any;
                      const directMsg = raw?.error || raw?.message || raw?.status;
                      const nestedMsg = raw?.lastProviderResponse?.error || raw?.lastProviderResponse?.message;
                      const errorText = nestedMsg || directMsg;
                      return errorText ? translateProviderError(errorText) : 'Нет текстового комментария';
                    })()}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID сессии API</label>
                  <div className="text-xs font-mono text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 truncate">
                    {order.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {order.comments && (
          <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-blue-50 bg-blue-50/30">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <MessageSquare size={18} className="text-blue-500" />
                Комментарии пользователя
              </h3>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                {order.comments}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px]">
              <Database size={18} className="text-amber-500" />
              Лог ответа провайдера
            </h3>
          </div>
          <div className="p-6 bg-slate-900 overflow-x-auto">
            <pre className="text-xs text-blue-300 font-mono leading-relaxed">
              {order.providerRawResponse
                ? JSON.stringify(order.providerRawResponse, null, 2)
                : '// Нет данных от API провайдера'}
            </pre>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-4 uppercase">
            {(order.user.username || 'U').substring(0, 2)}
          </div>
          <h4 className="text-lg font-bold text-slate-800">@{order.user.username || 'unknown'}</h4>
          <p className="text-[10px] text-slate-400 font-mono mb-4">{order.userId}</p>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4 my-4">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Баланс</div>
              <div className="text-sm font-bold text-slate-800">{formatAmount(order.user.balance)}₽</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Траты</div>
              <div className="text-sm font-bold text-slate-800">{formatAmount(order.user.spent)}₽</div>
            </div>
          </div>

          <Link
            href={`/admin/users/${order.userId}`}
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
          >
            <User size={16} />
            Профиль клиента
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            История изменений
          </h4>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1"></div>
                <div className="absolute top-3 bottom-[-16px] left-[3.5px] w-[1px] bg-slate-100"></div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">Заказ создан</div>
                <div className="text-[10px] text-slate-400" suppressHydrationWarning>{new Date(order.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
              <div>
                <div className="text-xs font-bold text-slate-700">Последнее обновление</div>
                <div className="text-[10px] text-slate-400" suppressHydrationWarning>{new Date(order.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}