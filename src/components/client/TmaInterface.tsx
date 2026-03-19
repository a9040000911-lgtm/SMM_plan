"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
    ShoppingBag,
    User as UserIcon,
    History,
    Loader2,
    Layers,
    ShoppingCart,
    Plus,
    Link2,
    Sparkles,
    ShieldCheck,
    AlertTriangle,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/ui";
import { validateTargetLink } from "@/lib/services/link-validator";
import { getWebSmartHint } from "@/utils/tips";

import { useLanguage } from "@/providers/language-provider";

export function TmaInterface() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState("shop");
    const [link, setLink] = useState("");
    const [analysis, setAnalysis] = useState<any>(null);
    const [catalog, setCatalog] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [error, setError] = useState("");

    // Order State
    const [selectedService, setSelectedService] = useState<any>(null);
    const [orderQuantity, setOrderQuantity] = useState<number>(0);
    const [orderLink, setOrderLink] = useState("");
    const [isOrdering, setIsOrdering] = useState(false);
    const [orderError, setOrderError] = useState("");

    const getTelegram = () => {
        if (typeof window !== 'undefined') return (window as any).Telegram?.WebApp;
        return null;
    };

    const fetchCatalog = useCallback(async () => {
        setLoadingCatalog(true);
        try {
            const tg = getTelegram();
            const res = await fetch("/api/tma/services", {
                headers: { "Authorization": `tma ${tg?.initData || ""}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCatalog(data);
            }
        } catch (err) {
            console.error("Failed to fetch catalog", err);
        } finally {
            setLoadingCatalog(false);
        }
    }, []);

    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    const handleAnalyze = async () => {
        if (!link) return;
        setLoading(true);
        setError("");
        try {
            const tg = getTelegram();
            const res = await fetch("/api/tma/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `tma ${tg?.initData || ""}`
                },
                body: JSON.stringify({ link })
            });
            const data = await res.json();
            if (res.ok) {
                setAnalysis(data);
                setOrderLink(link);
                if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            } else setError(data.error);
        } catch (_err) { setError("Ошибка сети"); }
        finally { setLoading(false); }
    };

    const handleCreateOrder = async () => {
        if (!selectedService || !orderLink || !orderQuantity) return;
        setIsOrdering(true);
        setOrderError("");
        try {
            const tg = getTelegram();
            // In TMA, we use the specialized TMA orders endpoint which validates the telegram initData
            const res = await fetch("/api/tma/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `tma ${tg?.initData || ""}`
                },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    link: orderLink,
                    quantity: orderQuantity
                })
            });
            const data = await res.json();
            if (res.ok) {
                setSelectedService(null);
                setOrderQuantity(0);
                if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                if (tg?.showAlert) tg.showAlert("Заказ успешно создан!");
                setActiveTab("orders");
            } else {
                setOrderError(data.error || "Ошибка при создании заказа");
            }
        } catch {
            setOrderError("Ошибка сети");
        } finally {
            setIsOrdering(false);
        }
    };

    const openOrderForm = (service: any) => {
        setSelectedService(service);
        setOrderQuantity(service.min || 100);
        if (!orderLink && link) setOrderLink(link);
        setOrderError("");
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10 select-none pb-24">
            {/* Background Grid & Premium Mesh */}
            <div className="fixed inset-0 pointer-events-none -z-20 mesh-bg opacity-30" />
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] grid-bg -z-10" />

            <main className="flex-1 p-6 pt-12 space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic text-foreground">
                        SMM<span className="text-primary italic">PLAN</span>
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-40 font-black uppercase tracking-widest text-foreground">{t.tma.subtitle}</span>
                        <div className="h-[1px] flex-1 bg-border/20" />
                    </div>
                </div>

                {activeTab === "shop" && (
                    <div className="space-y-8">
                        {/* Analyzer Instrument */}
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="glass p-4 rounded-3xl border border-white/40 group-focus-within:border-primary/50 transition-all flex items-center gap-3 cyber-box shadow-sm">
                                    <Link2 className="text-muted-foreground" size={18} />
                                    <input
                                        className="flex-1 bg-transparent outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground"
                                        placeholder={t.tma.analyze_placeholder}
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !link}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-3xl font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        <Sparkles size={18} /> {t.tma.analyze_action}
                                    </>
                                )}
                            </button>
                            {error && (
                                <div className="text-destructive text-[10px] font-black uppercase tracking-wider bg-destructive/5 p-2 rounded-xl text-center border border-destructive/10">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Results or Catalog */}
                        <AnimatePresence mode="wait">
                            {analysis ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-between items-center bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                                        <div className="text-[10px] font-black uppercase text-primary tracking-widest">{t.tma.found_spectrum} {analysis.platform}</div>
                                        <button onClick={() => setAnalysis(null)} className="text-[10px] font-black opacity-20 hover:opacity-100 uppercase transition-opacity">{t.tma.reset}</button>
                                    </div>

                                    {analysis.categories.map((cat: any) => (
                                        <div key={cat.name} className="space-y-3">
                                            <h3 className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-2">{cat.name}</h3>
                                            <div className="space-y-2">
                                                {cat.services.map((s: any) => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => openOrderForm(s)}
                                                        className="w-full glass p-4 rounded-2xl flex justify-between items-center border hover:border-primary/50 transition-all active:scale-[0.98] shadow-sm"
                                                    >
                                                        <div className="text-left">
                                                            <div className="text-xs font-bold leading-tight">{s.name}</div>
                                                            <div className="text-[10px] text-muted-foreground mt-0.5">{(s.price / 1000).toFixed(4)}₽ за 1 шт.</div>
                                                        </div>
                                                        <div className="bg-primary/5 text-primary p-2 rounded-xl">
                                                            <Plus size={14} />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Trust Badge */}
                                    <div className="glass border border-emerald-500/20 p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
                                        <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-2xl">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-black uppercase tracking-widest text-emerald-600">{t.tma.system_active}</div>
                                            <p className="text-[10px] text-emerald-600/60 font-medium">{t.tma.system_active_desc}</p>
                                        </div>
                                    </div>

                                    {/* Catalog Preview */}
                                    <div className="space-y-4 pt-4">
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 px-2">{t.tma.catalog_title}</h2>
                                        {loadingCatalog ? (
                                            <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin" /></div>
                                        ) : (
                                            <div className="space-y-4">
                                                {catalog && Object.entries(catalog).slice(0, 2).map(([platform, categories]: [string, any]) => (
                                                    <div key={platform} className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">{platform}</span>
                                                            <div className="h-[1px] flex-1 bg-border/20" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {Object.entries(categories).slice(0, 4).map(([category, _services]: [string, any]) => (
                                                                <div key={category} className="glass p-4 rounded-2xl border-white/40 text-left space-y-2 shadow-sm">
                                                                    <div className="text-[10px] font-bold tracking-tight">{category}</div>
                                                                    <div className="text-[8px] font-black text-primary/40 uppercase tracking-widest">{t.tma.available}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* ... Other Tabs in development ... */}
                {activeTab !== "shop" && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20 space-y-4">
                        <Loader2 className="animate-spin" size={32} />
                        <div className="text-[10px] font-black uppercase tracking-widest">{t.tma.module_dev}</div>
                    </div>
                )}

                {/* Order Confirmation Modal */}
                <AnimatePresence>
                    {selectedService && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedService(null)}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                className="relative w-full max-w-lg glass border-white/40 rounded-[2.5rem] shadow-premium p-8 space-y-6"
                            >
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black tracking-tight">{selectedService.name}</h2>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{(selectedService.price / 1000).toFixed(4)}₽ за 1 шт.</p>
                                </div>

                                {selectedService.requirements && (
                                    <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2 text-[8px] font-black text-destructive uppercase tracking-widest">
                                            <AlertTriangle size={10} /> {t.tma.attention}
                                        </div>
                                        <p className="text-[9px] font-bold text-destructive/80 uppercase italic leading-tight">
                                            {selectedService.requirements}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">{t.tma.order_link}</label>
                                        <input
                                            className={cn(
                                                "w-full glass py-4 px-6 text-sm outline-none transition-all shadow-inner",
                                                orderLink && !validateTargetLink(orderLink, selectedService.platform, selectedService.targetType).isValid
                                                    ? "border-destructive/50 focus:border-destructive"
                                                    : "border-white/40 focus:border-primary/50"
                                            )}
                                            value={orderLink}
                                            onChange={(e) => setOrderLink(e.target.value)}
                                            placeholder="https://t.me/..."
                                        />
                                        <div className="flex items-center gap-1.5 mt-1 ml-2 text-muted-foreground/60">
                                            <Info size={10} className="shrink-0" />
                                            <span className="text-[8px] font-black uppercase tracking-wider">
                                                {getWebSmartHint(selectedService.platform)}
                                            </span>
                                        </div>
                                        {orderLink && !validateTargetLink(orderLink, selectedService.platform, selectedService.targetType).isValid && (
                                            <div className="flex items-center gap-1.5 mt-1 ml-2 text-destructive">
                                                <AlertTriangle size={10} />
                                                <span className="text-[8px] font-black uppercase tracking-wider">
                                                    {validateTargetLink(orderLink, selectedService.platform, selectedService.targetType).error}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">{t.tma.order_qty}</label>
                                        <input
                                            type="number"
                                            className="w-full glass border border-white/40 rounded-2xl py-4 px-6 text-sm outline-none focus:border-primary/50 transition-all font-bold shadow-inner"
                                            value={orderQuantity}
                                            onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                                        />
                                        <div className="flex justify-between px-2 text-[9px] font-bold uppercase opacity-30">
                                            <span>{t.tma.min}: {selectedService.minQty || 10}</span>
                                            <span>{t.tma.max}: {selectedService.maxQty || 100000}</span>
                                        </div>
                                    </div>

                                    {/* Total Price Display */}
                                    <div className="bg-primary/10 border border-primary/20 p-5 rounded-3xl flex justify-between items-center">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">К оплате</div>
                                        <div className="text-2xl font-black italic text-primary">
                                            {(orderQuantity * (selectedService.price / 1000)).toFixed(2)} ₽
                                        </div>
                                    </div>
                                </div>

                                {orderError && (
                                    <div className="bg-destructive/5 text-destructive text-[10px] font-black uppercase p-3 rounded-xl border border-destructive/10 text-center">
                                        {orderError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setSelectedService(null)}
                                        className="flex-1 bg-muted py-4 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        {t.tma.cancel}
                                    </button>
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={isOrdering}
                                        className="flex-[2] bg-primary text-primary-foreground py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isOrdering ? <Loader2 className="animate-spin" size={16} /> : t.tma.order_btn}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            {/* Modern TMA Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 glass-dark text-white border-t border-white/10 px-4 py-4 flex justify-between items-center z-50">
                {[
                    { id: "shop", label: "Магазин", icon: ShoppingBag },
                    { id: "mass", label: "Опт", icon: Layers },
                    { id: "cart", label: "Корзина", icon: ShoppingCart },
                    { id: "orders", label: "Заказы", icon: History },
                    { id: "profile", label: "Профиль", icon: UserIcon },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "flex flex-col items-center gap-1.5 transition-all flex-1",
                            activeTab === item.id ? "text-primary scale-110" : "opacity-30"
                        )}
                    >
                        <item.icon size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}


