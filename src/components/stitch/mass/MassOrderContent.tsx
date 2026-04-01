"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import { 
    FileText, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    PlusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MassOrderContent() {
    const [ordersText, setOrdersText] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [magicCode, setMagicCode] = useState("");
    const [authMode, setAuthMode] = useState<'PASSWORD' | 'MAGIC' | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [status, setStatus] = useState<{ success?: string, error?: string } | null>(null);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                await fetch("/api/client/services");
            } catch (_error) { console.error(_error); }
        };
        fetchCatalog();

        // --- BROKEN LOOP PROTECTION: Restore draft if found ---
        try {
            const draftRaw = localStorage.getItem('smmplan_draft_mass');
            if (draftRaw) {
                const draft = JSON.parse(draftRaw);
                if (draft.expiresAt > Date.now()) {
                    setOrdersText(draft.text || "");
                    setEmail(draft.email || "");
                    setStatus({ success: "Ваш массовый заказ был восстановлен. Вы можете продолжить!" });
                }
                localStorage.removeItem('smmplan_draft_mass');
            }
        } catch (e) { console.error("Draft restore failed", e); }
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
                setStatus({ error: "Неверный формат данных. Используйте: Service_ID | Quantity | Link" });
                setLoading(false);
                return;
            }

            const res = await fetch("/api/client/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batch: parsedOrders,
                    email: email || undefined,
                    password: authMode === 'PASSWORD' ? password : undefined,
                    magicCode: authMode === 'MAGIC' ? magicCode : undefined
                })
            });

            const data = await res.json();
            
            if (!res.ok) {
                if (res.status === 409) {
                    setAuthMode('PASSWORD');
                    throw new Error(data.message || 'Email уже зарегистрирован. Введите пароль.');
                }
                throw new Error(data.error || "Ошибка при отправке");
            }

            // --- SEAMLESS AUTH ---
            if (data.loginToken) {
                try {
                    const { signIn } = await import("next-auth/react");
                    await signIn('credentials', { magicToken: data.loginToken, redirect: false });
                } catch (e) { console.warn("Mass Auth Failed", e); }
            }

            if (data.requiresPayment && data.paymentUrl) {
                // --- BROKEN LOOP PROTECTION ---
                localStorage.setItem('smmplan_draft_mass', JSON.stringify({
                    text: ordersText,
                    email: email,
                    expiresAt: Date.now() + 1000 * 60 * 60
                }));
                window.location.href = data.paymentUrl;
            } else {
                setStatus({ success: `Успешно создано заказов: ${parsedOrders.length}` });
                setOrdersText("");
            }
        } catch (err: any) {
            setStatus({ error: err.message || "Произошла ошибка при отправке" });
        } finally {
            setLoading(false);
        }
    };

    const handleSendMagicCode = async () => {
        if (!email || isSendingCode) return;
        setIsSendingCode(true);
        setStatus(null);
        try {
            const res = await fetch('/api/client/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                setAuthMode('MAGIC');
                setStatus({ success: 'Код отправлен на почту!' });
            } else {
                const data = await res.json();
                setStatus({ error: data.error || 'Не удалось отправить код' });
            }
        } catch (e) {
            setStatus({ error: 'Ошибка сети' });
        } finally {
            setIsSendingCode(false);
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
                        <div className="space-y-4 pt-4 border-t border-border/10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2 text-primary">Email для подтверждения</label>
                                <input 
                                    type="email"
                                    placeholder="example@mail.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (authMode) setAuthMode(null);
                                    }}
                                    className="w-full bg-muted/20 border border-border focus:border-primary/50 outline-none rounded-2xl py-3 px-6 text-sm font-medium transition-all"
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {authMode === 'PASSWORD' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Пароль аккаунта</label>
                                        <input 
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-muted/30 border border-primary/30 rounded-2xl py-3 px-6 text-sm font-medium outline-none focus:border-primary transition-all"
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleSendMagicCode}
                                            className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors px-2"
                                        >
                                            Забыли пароль? Войти по коду
                                        </button>
                                    </motion.div>
                                )}

                                {authMode === 'MAGIC' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-[10px] font-black uppercase tracking-widest text-success ml-2">Код из письма</label>
                                        <input 
                                            type="text"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={magicCode}
                                            onChange={(e) => setMagicCode(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-success/5 border border-success/30 rounded-2xl py-3 px-6 text-sm font-medium outline-none focus:border-success transition-all text-center tracking-[0.5em]"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setAuthMode('PASSWORD')}
                                            className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors px-2"
                                        >
                                            Вернуться к паролю
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {status?.error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-3 p-5 bg-destructive/5 border border-destructive/10 rounded-2xl text-destructive text-[10px] font-black uppercase tracking-tight"
                            >
                                <AlertCircle size={18} />
                                {status.error}
                            </motion.div>
                        )}

                        {status?.success && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-3 p-5 bg-success/5 border border-success/10 rounded-2xl text-success text-[10px] font-black uppercase tracking-tight"
                            >
                                <CheckCircle2 size={18} />
                                {status.success}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !ordersText.trim()}
                            className="w-full bg-slate-950 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-primary transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Запустить процесс <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}


