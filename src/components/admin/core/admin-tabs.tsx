"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/utils/ui';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface TabItem {
    label: string;
    icon: React.ReactNode;
    id?: string;
    description?: string;
}

interface AdminTabsProps {
    tabs: TabItem[];
    children: React.ReactNode[];
    initialTab?: number;
    contentClassName?: string;
}

export function AdminTabs({ tabs, children, initialTab = 0, contentClassName, className }: AdminTabsProps & { className?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Allow controlling tab via URL query param ?tab=1 or ?tab=health
    const queryTab = searchParams.get('tab');

    // Determine initial index based on query or prop
    const getInitialIndex = () => {
        if (queryTab) {
            // Try to find by ID first
            const idIndex = tabs.findIndex(t => t.id === queryTab);
            if (idIndex !== -1) return idIndex;

            // Try numeric index
            const numIndex = parseInt(queryTab);
            if (!isNaN(numIndex) && numIndex >= 0 && numIndex < tabs.length) return numIndex;
        }
        return initialTab;
    };

    const [activeTab, setActiveTab] = useState<number | null>(null);

    // Initial sync
    React.useEffect(() => {
        setActiveTab(getInitialIndex());
    }, []);

    // Sync state with URL changes (e.g. from children or back/forward buttons)
    React.useEffect(() => {
        const newIndex = getInitialIndex();
        if (newIndex !== activeTab) {
            setActiveTab(newIndex);
        }
    }, [searchParams, tabs]);

    // Update URL when tab changes without full reload
    const handleTabChange = (index: number) => {
        setActiveTab(index);
        const params = new URLSearchParams(searchParams.toString());
        if (tabs[index].id) {
            params.set('tab', tabs[index].id);
        } else {
            params.set('tab', index.toString());
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    if (activeTab === null) return <div className="min-h-[400px]" />; // Prevent mismatch

    return (
        <div className={cn("space-y-6 animate-in fade-in duration-500", className)}>
            {/* Horizontal Tabs Navigation */}
            <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 max-w-full overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id || index}
                        onClick={() => handleTabChange(index)}
                        className={`
                            relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shrink-0
                            ${activeTab === index
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}
                        `}
                    >
                        {tab.icon && (
                            <span className={activeTab === index ? 'text-blue-500' : 'text-slate-400'}>
                                {tab.icon}
                            </span>
                        )}
                        {tab.label}
                        {activeTab === index && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Active Content Body */}
            <div className={cn("min-h-0 flex-1 flex flex-col", contentClassName)}>
                {/* Header for Active Tab if it has description */}
                {tabs[activeTab]?.description && (
                    <div className="mb-6 flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm animate-in slide-in-from-top-2 duration-300 shrink-0">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                            <Info size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">
                                {tabs[activeTab].label}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                                {tabs[activeTab].description}
                            </p>
                        </div>
                    </div>
                )}

                {/* The actual children from parent */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1 min-h-0">
                    {Array.isArray(children) ? children[activeTab] : children}
                </div>
            </div>
        </div>
    );
}


