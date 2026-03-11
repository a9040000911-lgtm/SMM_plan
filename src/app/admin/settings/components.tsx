"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Globe, CreditCard, Bot, ShieldAlert, FileText, Save, Server } from 'lucide-react';

interface SettingsTabsProps {
    children: React.ReactNode[];
}

export function SettingsTabs({ children }: SettingsTabsProps) {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { label: "Общие", icon: Globe },
        { label: "Финансы", icon: CreditCard },
        { label: "Telegram Бот", icon: Bot },
        { label: "Модерация", icon: ShieldAlert },
        { label: "Юридическая", icon: FileText },
        { label: "Система", icon: Server },
    ];

    return (
        <div className="space-y-8">
            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.label}
                        type="button"
                        onClick={() => setActiveTab(index)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === index
                                ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 scale-100"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50 scale-95 opacity-70 hover:opacity-100"
                        )}
                    >
                        <tab.icon size={16} className={cn(activeTab === index ? "text-primary" : "")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {React.Children.map(children, (child, index) => (
                    <div className={cn("transition-all duration-300", activeTab === index ? "block animate-in fade-in slide-in-from-bottom-2" : "hidden")}>
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SubmitButton() {
    // We use simple form submission for now, but this could be enhanced with useFormStatus
    return (
        <button
            type="submit"
            className="group relative flex items-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 overflow-hidden ml-auto"
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Save size={20} className="relative z-10" />
            <span className="relative z-10 uppercase tracking-widest text-xs">Сохранить</span>
        </button>
    );
}

export function ProjectSelector({ allProjects, currentProjectId }: { allProjects: any[], currentProjectId: string }) {
    return (
        <form className="flex items-center gap-2">
            <select
                name="projectId"
                defaultValue={currentProjectId}
                className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block w-full p-2.5 font-bold outline-none transition-all cursor-pointer"
                onChange={(e) => {
                    const form = e.target.form;
                    if (form) form.submit();
                }}
            >
                {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                ))}
            </select>
            <noscript>
                <button type="submit" className="px-3 py-2 bg-slate-200 rounded-lg text-xs font-bold">Go</button>
            </noscript>
        </form>
    );
}
