"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import { FileText, AlertCircle, CheckCircle2, Loader2, PlusCircle } from "lucide-react";

export function MassOrderContent() {
    const [ordersText, setOrdersText] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ success?: string, error?: string } | null>(null);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                await fetch("/api/client/services");
            } catch (_error) { console.error(_error); }
        };
        fetchCatalog();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const lines = ordersText.trim().split("\n");
            const parsedOrders = lines.map(line => {
                const parts = line.split("|").map(p => p.trim());
                return {
                    serviceId: parts[0],
                    quantity: parseInt(parts[1]),
                    link: parts[2]
                };
            }).filter(o => o.serviceId && o.quantity && o.link);

            if (parsedOrders.length === 0) {
                setStatus({ error: "Неверный формат данных" });
                setLoading(false);
                return;
            }

            let successCount = 0;
            for (const order of parsedOrders) {
                const res = await fetch("/api/client/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(order)
                });
                if (res.ok) successCount++;
            }

            setStatus({ success: `Успешно создано зазаков: ${successCount}` });
            setOrdersText("");
        } catch (_error) {
            setStatus({ error: "Произошла ошибка при отправке" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-12">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tighter uppercase italic">Массовый заказ (Опт)</h1>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Создание десятков заказов в одно нажатие</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-muted/30 p-8 rounded-[2rem] border border-border/50 space-y-6">
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-primary" />
                            <h2 className="text-xs font-black uppercase tracking-widest">Инструкция</h2>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-medium leading-relaxed opacity-60">
                                Вводите данные в формате одной строки на заказ:<br />
                                <span className="font-bold text-foreground">Service_ID | Quantity | Link</span>
                            </p>
                            <div className="bg-card/50 p-4 rounded-xl border border-border/30">
                                <code className="text-[9px] font-mono break-all opacity-80">
                                    345 | 1000 | https://t.me/channel<br />
                                    122 | 5000 | https://instagram.com/p/..
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Список заказов</label>
                            <textarea
                                value={ordersText}
                                onChange={(e) => setOrdersText(e.target.value)}
                                placeholder="Service_ID | Quantity | Link"
                                className="w-full min-h-[400px] bg-muted/30 border border-border focus:border-primary/50 outline-none rounded-3xl p-6 text-sm font-mono tracking-tight transition-all resize-none"
                            />
                        </div>

                        {status?.error && (
                            <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/10 rounded-2xl text-destructive text-[10px] font-black uppercase">
                                <AlertCircle size={16} />
                                {status.error}
                            </div>
                        )}

                        {status?.success && (
                            <div className="flex items-center gap-3 p-4 bg-success/5 border border-success/10 rounded-2xl text-success text-[10px] font-black uppercase">
                                <CheckCircle2 size={16} />
                                {status.success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !ordersText.trim()}
                            className="w-full bg-primary text-primary-foreground py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    <PlusCircle size={18} /> Запустить массовый процесс
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
