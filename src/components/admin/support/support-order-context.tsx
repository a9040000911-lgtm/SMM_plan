'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { Package, ExternalLink, Clock } from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import { getOrderStatusLabel, getOrderStatusColor } from '@/utils/order-utils';
import { InlineOrderActions } from '@/components/admin/orders/inline-order-actions';
import { CopyButton } from '@/components/admin/core/copy-button';

export function SupportOrderContext({ order }: { order: any }) {
  if (!order) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 font-black uppercase tracking-tighter text-xs">
          <Package size={16} className="text-slate-400" />
          Контекст заказа
        </div>
        <div className="px-2 py-0.5 rounded text-[10px] font-black uppercase" 
          style={{ 
            backgroundColor: `${getOrderStatusColor(order.status as any)}15`, 
            color: getOrderStatusColor(order.status as any) 
          }}>
          {getOrderStatusLabel(order.status as any)}
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {/* Order Info */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">ID заказа</div>
            <div className="text-sm font-black text-slate-800 flex items-center gap-1">
              #{order.id}
              <CopyButton value={String(order.id)} label="ID" />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Сумма</div>
            <div className="text-sm font-black text-slate-800">{formatAmount(order.totalPrice)} ₽</div>
          </div>
        </div>

        {/* Link & Quantity */}
        <div className="bg-slate-50 rounded p-3 text-xs">
          <div className="flex justify-between items-center mb-1">
             <div className="font-bold text-slate-600">Количество: {order.quantity}</div>
             <div className="font-bold text-slate-400">Остаток: {order.remains || 0}</div>
          </div>
          <a href={order.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium truncate max-w-full">
            <ExternalLink size={12} className="shrink-0" />
            <span className="truncate">{order.link}</span>
          </a>
        </div>

        {/* Service */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Услуга</div>
          <div className="text-xs font-semibold text-slate-700">
            {order.internalService?.name || 'Неизвестная услуга'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">ID услуги: {order.internalService?.id}</div>
        </div>

        {/* Quick Actions Support */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Clock size={12} />
                {new Date(order.createdAt).toLocaleDateString()}
            </div>
            {/* The primary 1-click UX optimization */}
            <InlineOrderActions orderId={order.id} status={order.status} />
        </div>
      </div>
    </div>
  );
}
