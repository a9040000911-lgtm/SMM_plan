"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Link as LinkIcon, Calendar, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChurnIndicator } from "@/components/client/ChurnIndicator";

export const dynamic = 'force-dynamic';

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // We reuse the list endpoint with a filter or create a new dedicated one.
                // For simplicity, let's assume we need a dedicated ID endpoint or filter the list.
                // Ideally, we'd have /api/client/orders/[id], but I'll update the plan to create it or skip it efficiently.
                // Wait, I didn't create /api/client/orders/[id]/route.ts yet. 
                // I will fetch the list and find one for now to save time, OR implement the route.
                // Implementing route is better.
                const res = await fetch(`/api/client/orders/${params.id}`);
                // Note: I haven't created this route yet, I need to create it!
                if (res.ok) setOrder(await res.json());
                else if (res.status === 404) router.push('/orders');
            } catch (_error) { console.error(_error); }
            finally { setLoading(false); }
        };

        // Let's create the route first in the next step, but client code is here.
        fetchOrder();
    }, [params.id, router]);

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;
    if (!order) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-black uppercase tracking-widest mb-4">
                <ArrowLeft size={14} /> Назад к списку
            </Link>

            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

                <div className="space-y-6 relative">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Заказ</span>
                            <h1 className="text-2xl font-black italic">#{order.id}</h1>
                        </div>
                        <BadgeStatus status={order.status} />
                    </div>

                    <div className="p-4 bg-muted/30 rounded-2xl space-y-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Услуга</span>
                            <div className="font-bold text-lg">{order.serviceName}</div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-background rounded-xl border border-border/50">
                            <LinkIcon size={14} className="text-muted-foreground shrink-0" />
                            <div className="text-xs font-mono truncate text-primary">{order.link}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/30 rounded-2xl space-y-1 text-center">
                            <Activity size={16} className="mx-auto text-muted-foreground mb-1" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Количество</span>
                            <div className="font-black text-xl">{order.quantity}</div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-2xl space-y-1 text-center">
                            <DollarSign size={16} className="mx-auto text-muted-foreground mb-1" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Сумма</span>
                            <div className="font-black text-xl">{Number(order.totalPrice || order.price).toFixed(2)}₽</div>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                            <Calendar size={12} />
                            Создан: {new Date(order.createdAt).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Churn Prediction Indicator */}
            <ChurnIndicator orderId={order.id} />

            <div className="text-center">
                <button className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors">
                    Сообщить о проблеме
                </button>
            </div>
        </div>
    );
}

const BadgeStatus = ({ status }: { status: string }) => {
    // Same badge component
    const styles: any = {
        PENDING: "bg-yellow-500/10 text-yellow-500",
        PROCESSING: "bg-blue-500/10 text-blue-500",
        COMPLETED: "bg-emerald-500/10 text-emerald-500",
        PARTIAL: "bg-purple-500/10 text-purple-500",
        CANCELED: "bg-rose-600 text-white shadow-lg shadow-rose-200"
    };
    return (
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${styles[status] || "bg-gray-500/10 text-gray-400"}`}>
            {status}
        </span>
    );
}
