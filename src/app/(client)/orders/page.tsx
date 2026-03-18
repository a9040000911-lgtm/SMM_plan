"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */


import React, { useState, useEffect, Suspense } from "react";
import { Loader2, ExternalLink, Database, Activity, Box } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/utils/ui";

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>}>
            <OrdersContent />
        </Suspense>
    );
}

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const page = parseInt(searchParams.get("page") || "1");

    const [orders, setOrders] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/client/orders?page=${page}&limit=20`);
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders);
                    setTotal(data.total);
                    setTotalPages(data.totalPages);
                }
            } catch (_error) { console.error(_error); }
            finally { setLoading(false); }
        };
        fetchOrders();
    }, [page]);

    const handlePageChange = (newPage: number) => {
        router.push(`/orders?page=${newPage}`);
    };

    return (
        <div className="space-y-10 pb-20 px-4 md:px-0">
            {/* HUD Title Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div className="space-y-4 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <div className="w-1 h-8 bg-primary" />
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-white">
                            SYSTEM_LOGS<span className="text-primary/40">.LST</span>
                        </h1>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">
                        <Database size={12} className="text-primary" />
                        TOTAL_ENTRIES_FOUND: <span className="text-primary">{total}</span>
                    </div>
                </div>

                <Link href="/">
                    <button className="cyber-box bg-primary text-black px-8 py-4 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.1)] flex items-center gap-3">
                        <Activity size={14} /> NEW_PROTOCOL_INIT
                    </button>
                </Link>
            </div>

            {/* Main Log Console */}
            <div className="cyber-box bg-[#0a0c12]/40 relative overflow-hidden">
                {/* Decorative Brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/20" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/20" />

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-24 gap-6">
                        <Loader2 className="animate-spin text-primary" size={40} />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">FETCHING_DATABASE_ENTRIES...</span>
                    </div>
                ) : orders.length > 0 ? (
                    <>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left font-mono">
                                <thead className="bg-primary/5 text-[9px] uppercase font-black tracking-[0.3em] text-primary/40 border-b border-primary/10">
                                    <tr>
                                        <th className="p-6 pl-10">SERVICE_ID</th>
                                        <th className="p-6">LOG_SUBJECT</th>
                                        <th className="p-6">TARGET_ENDPOINT</th>
                                        <th className="p-6 text-center">UNITS</th>
                                        <th className="p-6 text-center">STATUS_PROTOCOL</th>
                                        <th className="p-6">TIMESTAMP</th>
                                        <th className="p-6 pr-10 text-right">VALUE_RUB</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-primary/5 transition-all cursor-pointer group"
                                            onClick={() => router.push(`/orders/${order.id}`)}
                                        >
                                            <td className="p-4 pl-10 text-[10px] text-primary/30 font-black group-hover:text-primary transition-colors italic tracking-widest">
                                                {">> "} #{order.publicId || order.id}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-black text-white uppercase italic text-[12px]">{order.serviceName}</div>
                                                <div className="text-[8px] uppercase tracking-widest text-slate-500">{order.category}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 max-w-[180px] text-slate-500 group-hover:text-primary transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); window.open(order.link, '_blank'); }}>
                                                    <span className="truncate text-[10px] font-bold italic">{order.link}</span>
                                                    <ExternalLink size={10} className="shrink-0 opacity-30" />
                                                </div>
                                            </td>
                                            <td className="p-4 font-black text-center text-white">{order.quantity}</td>
                                            <td className="p-4 text-center">
                                                <BadgeStatus status={order.status} />
                                            </td>
                                            <td className="p-4 text-[10px] font-black text-slate-500 whitespace-nowrap italic">
                                                {new Date(order.createdAt).toISOString().split('T')[0].split('-').join('_')}
                                            </td>
                                            <td className="p-4 pr-10 text-right">
                                                <div className="font-black italic text-lg text-primary text-glow">{Number(order.price).toFixed(2)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination (HUD Style) */}
                        {totalPages > 1 && (
                            <div className="p-8 flex items-center justify-center gap-6 border-t border-white/5 bg-black/20">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => handlePageChange(page - 1)}
                                    className="cyber-box px-6 py-2 border-primary/20 hover:border-primary text-[10px] font-black uppercase text-primary disabled:opacity-20 transition-all italic"
                                >
                                    PREV_NODE
                                </button>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                                    PAGE: <span className="text-primary italic">{page}</span> / {totalPages}
                                </div>
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => handlePageChange(page + 1)}
                                    className="cyber-box px-6 py-2 border-primary/20 hover:border-primary text-[10px] font-black uppercase text-primary disabled:opacity-20 transition-all italic"
                                >
                                    NEXT_NODE
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-24 text-center space-y-6">
                        <Box size={48} className="mx-auto text-primary/10" />
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">NULL_DATA_DETECTED</h3>
                            <p className="text-[10px] text-slate-500 max-w-sm mx-auto uppercase tracking-widest italic leading-loose">
                                System history is empty. No previous protocols found in the database stream.
                            </p>
                        </div>
                        <Link href="/">
                            <button className="cyber-box bg-primary/10 border-primary/20 text-primary px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-black transition-all">
                                BEGIN_FIRST_EXECUTION
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] scan-line" />
        </div>
    );
}

const BadgeStatus = ({ status }: { status: string }) => {
    const styles: any = {
        PENDING: "border-yellow-500/30 text-yellow-500 bg-yellow-500/5",
        PROCESSING: "border-blue-500/30 text-blue-500 bg-blue-500/5",
        COMPLETED: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5",
        PARTIAL: "border-purple-500/30 text-purple-500 bg-purple-500/5",
        CANCELED: "border-rose-500 text-white bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.3)]"
    };

    const labels: any = {
        PENDING: "WAITING",
        PROCESSING: "RUNNING",
        COMPLETED: "SUCCESS",
        PARTIAL: "PARTIAL",
        CANCELED: "ABORTED"
    };

    return (
        <span className={cn(
            "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 border leading-none italic inline-block",
            styles[status] || "border-slate-500/30 text-slate-500 bg-slate-500/5"
        )}>
            {labels[status] || status}
        </span>
    );
};


