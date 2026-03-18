'use client';

import React from 'react';
import { 
    Globe, 
    ChevronDown, 
    Monitor, 
    Smartphone, 
    Zap, 
    Save
} from 'lucide-react';
import { cn } from '@/utils/ui';
import { PAGES, ViewportSize } from '../types';

interface EditorToolbarProps {
    activePage: string;
    viewportSize: ViewportSize;
    isPending: boolean;
    isPageMenuOpen: boolean;
    onPageSelect: (slug: string) => void;
    onViewportChange: (size: ViewportSize) => void;
    onSave: () => void;
    onTogglePageMenu: () => void;
}

export function EditorToolbar({
    activePage,
    viewportSize,
    isPending,
    isPageMenuOpen,
    onPageSelect,
    onViewportChange,
    onSave,
    onTogglePageMenu
}: EditorToolbarProps) {
    const activePageLabel = PAGES.find(p => p.slug === activePage)?.label || 'Выберите страницу';

    return (
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-50 shadow-sm">
            <div className="flex items-center gap-6">
                {/* Page Selector Dropdown */}
                <div className="relative">
                    <button 
                        onClick={onTogglePageMenu}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-xl transition-all group"
                    >
                        <Globe size={18} className="text-blue-600" />
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            {activePageLabel}
                        </span>
                        <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isPageMenuOpen && "rotate-180")} />
                    </button>

                    {isPageMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2 z-[60]">
                            {PAGES.map(page => (
                                <button
                                    key={page.slug}
                                    onClick={() => onPageSelect(page.slug)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left",
                                        activePage === page.slug ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {page.icon}
                                    {page.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* Viewport Controls */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button 
                        onClick={() => onViewportChange('desktop')}
                        className={cn("p-2 rounded-lg transition-all", viewportSize === 'desktop' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
                    >
                        <Monitor size={18} />
                    </button>
                    <button 
                        onClick={() => onViewportChange('mobile')}
                        className={cn("p-2 rounded-lg transition-all", viewportSize === 'mobile' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
                    >
                        <Smartphone size={18} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1 bg-slate-50 rounded-full px-4 py-2 border border-slate-100">
                    <Zap size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Live Mode</span>
                </div>

                <button 
                    onClick={onSave}
                    disabled={isPending}
                    className="flex items-center gap-3 px-8 py-3 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    <Save size={16} />
                    {isPending ? 'Публикация...' : 'Опубликовать'}
                </button>
            </div>
        </div>
    );
}


