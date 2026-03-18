"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { cn } from "@/utils/ui";

interface ProgressBarProps {
    total: number;
    completed: number;
    status: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ total, completed, status }) => {
    const progress = total > 0 ? Math.min((completed / total) * 100, 100) : 0;

    const colorClasses: Record<string, string> = {
        PROCESSING: "bg-blue-500",
        COMPLETED: "bg-emerald-500",
        PARTIAL: "bg-orange-500",
        PENDING: "bg-yellow-500",
    };

    const bgColor = colorClasses[status] || "bg-slate-500";

    return (
        <div className="w-full space-y-1">
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-700 ease-out", bgColor)}
                    style={{ width: `${progress}%` }}
                />
            </div>
            {/* Progress text */}
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                <span>{completed.toLocaleString()} / {total.toLocaleString()}</span>
                <span className="font-black text-white">{progress.toFixed(0)}%</span>
            </div>
        </div>
    );
};


