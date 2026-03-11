"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useLanguage } from "@/providers/language-provider";
import React, { useState } from "react";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface IntelligenceHeroProps {
    onAnalyze: (link: string) => Promise<void>;
    loading: boolean;
    error?: string;
    isAnalyzed: boolean;
    compact?: boolean;
}

export const IntelligenceHero: React.FC<IntelligenceHeroProps> = ({
    onAnalyze,
    loading,
    error,
    isAnalyzed,
    compact
}) => {
    const { t } = useLanguage();
    const [link, setLink] = useState("");

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (link && !loading) {
            onAnalyze(link);
        }
    };

    return (
        <div className={cn(
            "w-full max-w-6xl mx-auto flex flex-col items-center text-center relative z-20",
            compact ? "py-4 gap-4" : "py-20 md:py-32 gap-16"
        )}>
            {/* Background Glows */}
            {!compact && (
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
                    <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px] animate-pulse-slow delay-700" />
                </div>
            )}

            {/* HUD Status Line */}
            {!compact && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-0 left-0 w-full flex justify-between px-6 pointer-events-none text-muted-foreground/40 font-mono"
                >
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-[7px] font-bold tracking-[0.5em]">ВЕРСИЯ_СИСТЕМЫ: 16.0.10</span>
                        <div className="w-48 h-px bg-gradient-to-r from-primary/50 to-transparent" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[7px] font-bold tracking-[0.5em]">ЛОК_УЗЕЛ: МОСКВА_РФ</span>
                        <div className="w-48 h-px bg-gradient-to-l from-primary/50 to-transparent" />
                    </div>
                </motion.div>
            )}

            {/* Title Section */}
            <AnimatePresence mode="wait">
                {!compact && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-6 relative"
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "120px" }}
                            className="h-[2px] bg-primary mx-auto shadow-[0_0_10px_var(--primary)]"
                        />
                        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-foreground leading-none uppercase italic">
                            SMMPLAN<span className="text-primary text-glow-primary">.CORE</span>
                        </h1>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-muted-foreground text-[11px] max-w-lg mx-auto font-black uppercase tracking-[0.6em] leading-relaxed"
                        >
                            {t.hero.subtitle}
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analyzer Instrument */}
            <div className="w-full relative group max-w-4xl px-4">
                {/* Decorative Elements */}
                <div className="absolute -top-6 -left-2 w-16 h-16 border-t-[3px] border-l-[3px] border-primary/40 pointer-events-none rounded-tl-2xl transition-all group-hover:scale-110 group-hover:border-primary" />
                <div className="absolute -bottom-6 -right-2 w-16 h-16 border-b-[3px] border-r-[3px] border-primary/40 pointer-events-none rounded-br-2xl transition-all group-hover:scale-110 group-hover:border-primary" />

                <motion.form
                    layoutId="analyzer-input"
                    onSubmit={handleSubmit}
                    className="relative flex items-center gap-0 cyber-box p-1.5 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-700 group-hover:border-primary/40 bg-slate-950/80"
                >
                    <div className="bg-primary/10 px-8 py-6 border-r border-white/5 flex items-center gap-4 text-primary">
                        <Terminal size={22} className="animate-pulse" />
                        <span className="text-[11px] font-black tracking-widest hidden sm:inline italic">ВВОД://</span>
                    </div>

                    <input
                        type="text"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder={t.hero.placeholder}
                        className="flex-1 bg-transparent py-6 px-10 outline-none text-lg font-mono font-bold text-foreground placeholder:text-muted-foreground/30 selection:bg-primary/20"
                    />

                    <button
                        type="submit"
                        disabled={loading || !link}
                        className={cn(
                            "px-14 py-6 font-black text-[11px] uppercase tracking-[0.4em] transition-all relative overflow-hidden group/btn italic",
                            loading || !link
                                ? "bg-slate-900 text-slate-600 pointer-events-none"
                                : "bg-primary text-black hover:bg-white active:scale-95 shadow-[0_0_30px_var(--primary-glow)]"
                        )}
                    >
                        <div className="relative z-10 flex items-center gap-3">
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            {loading ? t.hero.analyzing : t.hero.analyze_btn}
                        </div>
                        <div className="scan-line" />
                    </button>
                </motion.form>

                {/* Info HUD Messages */}
                <AnimatePresence>
                    {(error || isAnalyzed) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 mt-8 w-full flex justify-center gap-6"
                        >
                            {error ? (
                                <div className="flex items-center gap-4 text-rose-500 bg-rose-500/5 border border-rose-500/20 px-8 py-4 text-[11px] font-black uppercase tracking-widest animate-pulse backdrop-blur-md rounded-lg">
                                    <AlertCircle size={16} />
                                    ОШИБКА_СИСТЕМЫ: {error}
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-8 py-4 text-[11px] font-black uppercase tracking-widest backdrop-blur-md rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                    <CheckCircle2 size={16} />
                                    ЦЕЛЬ_ОБНАРУЖЕНА: ССЫЛКА ПОДТВЕРЖДЕНА
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Platform Decoders */}
            {!compact && !isAnalyzed && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-16 mt-20 text-muted-foreground/30"
                >
                    {[
                        { id: 'TG_УЗЕЛ', val: '99.9% АПТАЙМ' },
                        { id: 'VK_ПОТОК', val: 'МГНОВЕННЫЙ_СТАРТ' },
                        { id: 'IG_API_v4', val: 'БЕЗОПАСНАЯ_СЕТЬ' },
                        { id: 'YT_СЕРВЕР', val: 'ВЫСОКОЕ_УДЕРЖАНИЕ' }
                    ].map(proto => (
                        <div key={proto.id} className="flex flex-col items-center gap-3 group cursor-default">
                            <div className="w-20 h-[2px] bg-white/5 relative overflow-hidden">
                                <motion.div
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-primary/40"
                                />
                            </div>
                            <span className="text-[10px] font-black tracking-[0.5em] group-hover:text-primary transition-colors">{proto.id}</span>
                            <span className="text-[8px] font-bold tracking-[0.2em] opacity-50">{proto.val}</span>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};
