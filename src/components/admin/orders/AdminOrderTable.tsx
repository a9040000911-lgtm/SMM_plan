/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { formatServiceId } from '@/utils/id-formatter';
import {
  ChevronRight,
  Clock,
  User as UserIcon,
  Edit2,
  Trash2
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import Link from 'next/link';
import { getOrderStatusLabel, getOrderStatusColor } from '@/utils/order-utils';
import { OrderInformationCell } from '@/components/admin/orders/order-information-cell';
import { UserQuickView } from '@/components/admin/users/user-quick-view';
import { CopyButton } from '@/components/admin/core/copy-button';
import { InlineSyncButton } from '@/components/admin/providers/inline-sync-button';

export function AdminOrderTable({ orders }: { orders: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/30">
            <th className="px-4 py-4 w-[40px]">
              <input type="checkbox" className="master-checkbox w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
            </th>
            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[80px]">ID</th>
            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[150px]">Пользователь</th>
            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[350px]">Информация</th>
            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[90px]">Цена</th>
            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[120px]">Статус</th>
            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[120px]">Создана</th>
            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[150px]">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-900">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50/80 transition-all group duration-200">
              <td className="px-4 py-6 align-top">
                <input
                  type="checkbox"
                  value={order.id}
                  className="order-checkbox w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"
                />
              </td>
              <td className="px-4 py-6 align-top">
                <div className="flex items-center gap-1.5">
                  <Link href={`/admin/orders/${order.id}`} className="text-[11px] font-black text-blue-600 hover:text-blue-700 underline decoration-blue-200 decoration-1 underline-offset-2">
                    {formatServiceId(order.internalService.platform, order.internalService.category, order.id)}
                  </Link>
                  <CopyButton value={String(order.id)} label="ID заказа" />
                </div>
              </td>

              <td className="px-4 py-6 align-top">
                <UserQuickView
                  userId={order.userId}
                  trigger={
                    <button className="text-[11px] font-bold text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-left">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <UserIcon size={10} />
                      </div>
                      <span className="break-all leading-tight">{order.user?.email || order.user?.username || '—'}</span>
                    </button>
                  }
                />
              </td>

              <td className="px-4 py-6 align-top overflow-hidden">
                <OrderInformationCell order={order} />
              </td>

              <td className="px-4 py-6 align-top text-right">
                <div className="flex flex-col items-end">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Продажа:</div>
                  <div className="text-sm font-black text-slate-900">{formatAmount(order.totalPrice)}₽</div>
                  {order.costPrice && (
                    <div className="mt-1 flex flex-col items-end">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Закупка:</div>
                      <div className="text-[10px] font-bold text-slate-500 font-mono italic">
                        {formatAmount(order.costPrice)}₽
                      </div>
                    </div>
                  )}
                </div>
              </td>

              <td className="px-4 py-6 align-top text-center">
                <span
                  className="text-[10px] font-black px-3 py-1.5 rounded-xl border-2 uppercase tracking-tight"
                  style={{
                    backgroundColor: `${getOrderStatusColor(order.status as any)}08`,
                    color: getOrderStatusColor(order.status as any),
                    borderColor: `${getOrderStatusColor(order.status as any)}15`
                  }}
                >
                  {getOrderStatusLabel(order.status as any)}
                </span>
              </td>

              <td className="px-4 py-6 align-top">
                <div className="text-[11px] font-bold text-slate-600 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-300" />
                    {new Date(order.createdAt).toISOString().split('T')[0]}
                  </div>
                  <div className="text-slate-400 ml-4.5">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </td>

              <td className="px-4 py-6 align-top text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                  <InlineSyncButton orderId={order.id} />
                  <Link href={`/admin/orders/${order.id}`} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


