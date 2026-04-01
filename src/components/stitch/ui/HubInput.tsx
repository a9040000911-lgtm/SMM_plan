"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/utils/ui";

interface HubInputProps {
    onAnalyze?: (url: string, platform: string | null) => void;
    className?: string;
    initialValue?: string;
}

export const HubInput = ({ onAnalyze, className, initialValue = "" }: HubInputProps) => {
    const [url, setUrl] = useState(initialValue);
    
    useEffect(() => {
        if (initialValue && initialValue !== url) {
            setUrl(initialValue);
        }
    }, [initialValue]);

    const [platform, setPlatform] = useState<"tg" | "vk" | "inst" | "yt" | "tiktok" | "discord" | "steam" | "google" | "yandex" | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const detectPlatform = (val: string) => {
        const lowerUrl = val.toLowerCase();
        if (!val) return null;
        
        // Simple detection for UI feedback
        if (lowerUrl.includes("t.me") || lowerUrl.includes("telegram")) return "tg";
        if (lowerUrl.includes("vk.com")) return "vk";
        if (lowerUrl.includes("instagram.com")) return "inst";
        if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return "yt";
        if (lowerUrl.includes("tiktok.com")) return "tiktok";
        return null;
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setUrl(val);
        
        const detected = detectPlatform(val);
        setPlatform(detected);

        if (val) {
            setIsAnalyzing(true);
            // Simulating AI Analysis flow for visual feedback
            const timer = setTimeout(() => {
                setIsAnalyzing(false);
                if (onAnalyze) onAnalyze(val, detected);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setIsAnalyzing(false);
        }
    };

    const themeColors: Record<string, string> = {
        tg: "from-blue-500 to-blue-600 shadow-blue-500/20 border-blue-500/30",
        vk: "from-blue-600 to-blue-700 shadow-blue-600/20 border-blue-600/30",
        inst: "from-pink-500 to-rose-500 shadow-rose-500/20 border-rose-500/30",
        yt: "from-red-500 to-red-600 shadow-red-500/20 border-red-500/30",
        tiktok: "from-slate-800 to-black shadow-slate-500/20 border-slate-500/30",
        discord: "from-indigo-500 to-indigo-600 shadow-indigo-500/20 border-indigo-500/30",
        null: "from-slate-400 to-slate-500 shadow-slate-200 border-slate-200"
    };

    const getTheme = () => platform ? themeColors[platform] : themeColors.null;

    const handleAnalyze = () => {
        if (!url) return;
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
            if (onAnalyze) onAnalyze(url, platform);
        }, 800);
    };

    return (
        <div className={cn("relative w-full max-w-2xl mx-auto group", className)}>
            {/* Ambient Platform Glow */}
            <AnimatePresence>
                {platform && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.15, scale: 1.1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={cn(
                            "absolute inset-0 rounded-[2.5rem] blur-[60px] -z-10 transition-colors duration-500",
                            platform === 'tg' && "bg-blue-500",
                            platform === 'vk' && "bg-blue-600",
                            platform === 'inst' && "bg-rose-500",
                            platform === 'yt' && "bg-red-500"
                        )}
                    />
                )}
            </AnimatePresence>

            <div className={cn(
                "glass-deep p-2 md:p-2 rounded-[2.5rem] flex flex-col md:flex-row items-stretch md:items-center gap-2 border transition-all duration-500 relative shadow-2xl shadow-blue-500/5",
                "focus-within:border-blue-500/40 focus-within:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]",
                platform ? "border-current opacity-100" : "border-slate-200/60 md:border-white/40",
                platform === 'tg' && "text-blue-500",
                platform === 'vk' && "text-blue-600",
                platform === 'inst' && "text-rose-500",
                platform === 'yt' && "text-red-500"
            )}>
                {/* AI Scanning Beam - Moved to a dedicated absolute wrapper to avoid button clipping */}
                <AnimatePresence>
                    {isAnalyzing && (
                        <div className="absolute inset-x-8 inset-y-0 overflow-hidden pointer-events-none rounded-[2.5rem]">
                            <motion.div 
                                initial={{ x: "-100%" }}
                                animate={{ x: "200%" }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-current to-transparent opacity-10"
                            />
                        </div>
                    )}
                </AnimatePresence>

                <div className="px-4 md:pl-8 md:pr-1 py-1 md:py-2 flex-1 flex flex-row items-center justify-center md:justify-start gap-4 relative text-center md:text-left">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => {
                            const val = e.target.value;
                            setUrl(val);
                            const detected = detectPlatform(val);
                            setPlatform(detected as any);
                            if (val) {
                                setIsAnalyzing(true);
                                const timer = setTimeout(() => {
                                    setIsAnalyzing(false);
                                    if (onAnalyze) onAnalyze(val, detected);
                                }, 1500);
                                return () => clearTimeout(timer);
                            } else {
                                setIsAnalyzing(false);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAnalyze();
                            }
                        }}
                        placeholder="Вставь ссылку для подбора..."
                        className="w-full bg-transparent outline-none text-slate-900 font-black placeholder:text-slate-500 placeholder:font-bold placeholder:uppercase placeholder:text-[10px] py-1 md:py-2 break-all text-center md:text-left placeholder:text-center md:placeholder:text-left"
                    />


                </div>

                <button 
                    onClick={handleAnalyze}
                    className={cn(
                        "w-[calc(100%-2rem)] mx-4 mb-4 md:m-0 md:w-auto px-4 md:px-6 py-3.5 md:py-2.5 rounded-2xl md:rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider transition-all shadow-xl active:scale-95 flex-shrink-0",
                        "bg-slate-950 text-white shadow-black/20 hover:bg-slate-900", 
                        "flex items-center justify-center gap-1.5"
                    )}
                >
                    {isAnalyzing ? (
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                        <>
                            <Zap className="w-4 h-4 fill-current" />
                            <span>Подобрать услуги</span>
                        </>
                    )}
                </button>
            </div>

            {/* AI Insight Label */}
            <AnimatePresence>
                {platform && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-8 left-8 flex items-center gap-2"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Подбор оптимальных стратегий для <span className="text-slate-900">{platform.toUpperCase()}</span>
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
