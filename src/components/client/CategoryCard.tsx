"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Heart, Eye, MessageCircle, Zap, Rocket, Activity, Box } from "lucide-react";
import { cn } from "@/utils/ui";

interface CategoryCardProps {
    category: string;
    description?: string;
    icon?: string;
    minPrice: number;
    platform: string;
    onClick: () => void;
    index: number;
    isActive?: boolean;
}

const iconMap: Record<string, any> = {
    "Подписчики": Users,
    "Лайки": Heart,
    "Просмотры": Eye,
    "Комментарии": MessageCircle,
    "Репосты": Zap,
    "Бусты": Rocket,
    "BOOSTS": Rocket,
    "SUBSCRIBERS": Users,
    "LIKES": Heart,
    "VIEWS": Eye,
    "COMMENTS": MessageCircle,
    "REPOSTS": Zap,
    "REACTIONS": Heart,
    "POLLS": Activity,
    "STORIES": Eye,
    "INVITE": Users,
    "SUBSCRIBERS_PRIVATE": Users,
    "VIEWS_PRIVATE": Eye,
    "COMMENTS_PRIVATE": MessageCircle,
    "REACTIONS_PRIVATE": Heart,
    "Default": Activity
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
    category,
    description,
    icon,
    minPrice,
    onClick,
    index,
    isActive
}) => {
    // Try to find icon in map or use default
    const Icon = (icon && iconMap[icon]) || iconMap[category] || iconMap.Default;

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * 0.05,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
            }}
            onClick={() => {
                if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                    window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
                }
                onClick();
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "cyber-box group flex flex-col p-6 text-left relative no-tap-highlight overflow-hidden",
                isActive
                    ? "border-primary/60 bg-primary/10 neon-glow-primary scale-[1.02]"
                    : "border-white/20 hover:border-primary/60 hover:bg-white/5"
            )}
        >
            {/* Border glow effect for active state */}
            {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
            )}

            {/* HUD Status Elements */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="text-[7px] font-black uppercase tracking-[0.3em] text-primary italic">СТАТУС_УЗЛА</div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black uppercase text-foreground/60 italic">ОНЛАЙН</span>
                </div>
            </div>

            <div className="absolute bottom-0 right-0 p-1 opacity-5">
                <Box size={40} />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full gap-6">
                <div className="flex items-start justify-between">
                    <div className={cn(
                        "w-14 h-14 rounded-xl border flex items-center justify-center transition-all duration-500 shadow-2xl overflow-hidden relative",
                        isActive ? "bg-primary text-black border-white/20" : "bg-white/10 border-white/20 group-hover:bg-primary/20 group-hover:text-primary group-hover:border-primary/60"
                    )}>
                        <div className="relative z-10">
                            <Icon size={28} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black tracking-[0.4em] opacity-30 italic uppercase">Индекс_0{index + 1}</span>
                        <div className="text-[9px] font-black text-primary/60 uppercase tracking-widest mt-1">v4_SECURE</div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <h3 className={cn(
                            "text-2xl font-black tracking-tight leading-none uppercase italic transition-colors",
                            isActive ? "text-white text-glow-primary" : "text-white/90 group-hover:text-primary"
                        )}>
                            {category}
                        </h3>
                        {description && (
                            <p className="text-[10px] text-slate-400 font-medium mt-2 line-clamp-2 leading-relaxed uppercase tracking-wide italic">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className="flex items-end justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1 italic">Стоимость от:</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-mono font-black text-white italic">
                                    {(minPrice / 1000).toFixed(4)}
                                </span>
                                <span className="text-sm font-bold text-primary italic">₽</span>
                            </div>
                        </div>

                        <div className={cn(
                            "w-10 h-10 border rounded-lg flex items-center justify-center transition-all duration-300",
                            isActive ? "border-primary/50 text-white bg-white/5" : "border-white/10 text-slate-500 group-hover:border-primary/40 group-hover:text-primary group-hover:bg-primary/5"
                        )}>
                            <TrendingUp size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Scanline Effect */}
            <div className="scan-line opacity-10 group-hover:opacity-30" />
        </motion.button>
    );
};


