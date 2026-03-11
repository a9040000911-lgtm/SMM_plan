"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { Server, Zap, Shield, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProviderBadgeProps {
    providerName?: string;
    className?: string;
}

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({ providerName, className }) => {
    if (!providerName) return null;

    const providerConfig: Record<string, { icon: React.ReactNode; color: string }> = {
        STREAM_PROMOTION: { icon: <Zap size={10} />, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" },
        TAQSIM: { icon: <Shield size={10} />, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
        PIONEER: { icon: <Globe size={10} />, color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
        DEFAULT: { icon: <Server size={10} />, color: "text-slate-500 bg-slate-500/10 border-slate-500/30" }
    };

    const config = providerConfig[providerName] || providerConfig.DEFAULT;

    return (
        <div className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[8px] font-black uppercase tracking-wider",
            config.color,
            className
        )}>
            {config.icon}
            <span>{providerName}</span>
        </div>
    );
};
