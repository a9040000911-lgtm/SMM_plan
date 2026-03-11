'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
    ShoppingCart,
    ExternalLink,
    ChevronRight,
    Package
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Order {
    id: number;
    internalService: {
        name: string;
    };
    totalPrice: string;
    status: string;
    quantity: number;
    remains: number;
    createdAt: Date;
    link: string;
    providerName?: string | null;
}

interface UserOrdersListProps {
    orders: Order[];
}

export function UserOrdersList({ orders }: UserOrdersListProps) {
    if (!orders || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                    <ShoppingCart size={24} />
                </div>
                <p className="text-slate-400 text-sm font-medium">У этого пользователя еще нет заказов</p>
            </div>
        );
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'CANCELED':
                return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'PROCESSING':
            case 'IN_PROGRESS':
                return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'PARTIAL':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            default:
                return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShoppingCart size={20} className="text-blue-500" />
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">История заказов</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Последние активности пользователя</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Всего {orders.length}
                </div>
            </div>

            <div className="divide-y divide-slate-50">
                {orders.map((order) => (
                    <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors group flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-white transition-colors">
                                <Package size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-800 truncate">{order.internalService.name}</h4>
                                    <span className="text-[10px] font-mono text-slate-400">#{order.id}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[10px] font-bold text-slate-900">{formatAmount(order.totalPrice)}₽</p>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <p className="text-[10px] text-slate-500 font-medium">{order.quantity} шт.</p>
                                    {order.remains > 0 && order.status !== 'COMPLETED' && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <p className="text-[10px] text-indigo-500 font-bold italic">Осталось: {order.remains}</p>
                                        </>
                                    )}
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                            <div className={cn(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border",
                                getStatusStyles(order.status)
                            )}>
                                {order.status}
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                    href={order.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200 rounded-lg transition-all shadow-sm"
                                    title="Перейти к ссылке"
                                >
                                    <ExternalLink size={14} />
                                </a>
                                <Link
                                    href={`/admin/orders/${order.id}`}
                                    className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-lg transition-all shadow-sm"
                                    title="Детали заказа"
                                >
                                    <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {orders.length >= 20 && (
                <div className="p-4 bg-slate-50/50 text-center border-t border-slate-100">
                    <Link href={`/admin/orders?userId=${orders[0]?.id}`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
                        Посмотреть все заказы в фильтре
                    </Link>
                </div>
            )}
        </div>
    );
}
