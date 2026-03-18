"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { Link2, Box } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/ui";
import { ProgressBar } from "./ProgressBar";
import { ProviderBadge } from "./ProviderBadge";

interface OrdersTabProps {
    orders: any[];
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders }) => {

    if (!orders || orders.length === 0) {
        return (
            <div className="bg-white border border-slate-100 rounded-[3rem] p-20 text-center space-y-8 shadow-[0_30px_60px_rgba(0,0,0,0.03)] flex flex-col items-center">
                <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200">
                    <Box size={48} />
                </div>
                <div className="space-y-3">
                    <h3 className="text-2xl font-black text-[#171717] tracking-tight uppercase italic">История пуста</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest max-w-sm mx-auto">Система ожидает вашего первого протокола выполнения заказа.</p>
                </div>
                <Link href="/">
                    <button className="bg-[#171717] hover:bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
                        Начать работу
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-slate-100 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b-2 border-slate-100">
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ID</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Услуга</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden md:table-cell">Цель</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Прогресс</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Статус</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Стоимость</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {orders.map((order) => {
                            const completed = order.quantity - (order.remains || 0);
                            const hasProgress = ['PROCESSING', 'PARTIAL', 'COMPLETED'].includes(order.status);

                            return (
                                <tr
                                    key={order.id}
                                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    onClick={() => window.location.href = `/orders/${order.id}`}
                                >
                                    <td className="p-5 text-[10px] font-black text-slate-300">#{order.id}</td>
                                    <td className="p-5">
                                        <div className="space-y-1.5">
                                            <div className="text-sm font-black text-[#171717] uppercase italic leading-none">{order.serviceName}</div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.category}</div>
                                                <ProviderBadge providerName={order.providerName} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 hidden md:table-cell">
                                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 transition-colors text-[10px] font-bold">
                                            <Link2 size={12} />
                                            <span className="truncate max-w-[200px] inline-block">
                                                {order.link}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {hasProgress ? (
                                            <ProgressBar
                                                total={order.quantity}
                                                completed={completed}
                                                status={order.status}
                                            />
                                        ) : (
                                            <span className="text-[10px] text-slate-300 font-black">—</span>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <BadgeStatus status={order.status} />
                                    </td>
                                    <td className="p-5 text-right font-black italic text-[#171717] text-lg tracking-tighter">
                                        {Number(order.price).toFixed(2)}₽
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const BadgeStatus = ({ status }: { status: string }) => {
    const styles: any = {
        PENDING: "border-amber-200 text-amber-600 bg-amber-50",
        PROCESSING: "border-blue-200 text-blue-600 bg-blue-50 animate-pulse",
        COMPLETED: "border-emerald-200 text-emerald-600 bg-emerald-50",
        PARTIAL: "border-indigo-200 text-indigo-600 bg-indigo-50",
        CANCELED: "border-rose-600 text-white bg-rose-600 shadow-md shadow-rose-200"
    };

    return (
        <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-4 py-1.5 border rounded-full italic shadow-sm whitespace-nowrap",
            styles[status] || "border-slate-200 text-slate-400 bg-slate-50"
        )}>
            {status}
        </span>
    );
};


