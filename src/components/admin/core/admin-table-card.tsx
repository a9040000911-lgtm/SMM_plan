/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminTableCardProps {
    title: string;
    icon?: LucideIcon;
    rightElement?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    description?: React.ReactNode;
}

export function AdminTableCard({
    title,
    icon: Icon,
    rightElement,
    children,
    className,
    description
}: AdminTableCardProps) {
    return (
        <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full ${className || ''}`}>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon size={16} className="text-slate-500" />}
                        <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">
                            {title}
                        </h2>
                    </div>
                    {description && (
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                            {description}
                        </p>
                    )}
                </div>
                {rightElement && (
                    <div className="flex items-center gap-3">
                        {rightElement}
                    </div>
                )}
            </div>
            
            <div className="overflow-x-auto w-full">
                {children}
            </div>
        </div>
    );
}
