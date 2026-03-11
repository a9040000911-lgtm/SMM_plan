'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Project {
    id: string;
    name: string;
    brandColor: string;
}

export function ProjectSelector({
    allProjects,
    currentProjectId
}: {
    allProjects: Project[],
    currentProjectId: string | null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const currentProject = currentProjectId === 'all'
        ? { id: 'all', name: 'Все проекты', brandColor: '#3b82f6' }
        : allProjects.find(p => p.id === currentProjectId) || allProjects[0];

    const isGlobal = currentProjectId === 'all' || !currentProjectId;

    const handleSelect = (id: string) => {
        // Set cookie and refresh
        document.cookie = `active_project_id=${id}; path=/; max-age=31536000`;
        setIsOpen(false);
        router.refresh();
    };

    if (allProjects.length === 0) return null;

    return (
        <div className="relative group">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                Текущий контекст
            </div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 transition-all w-full justify-between rounded-xl border",
                    isGlobal
                        ? "bg-white border-slate-200 text-slate-900 shadow-sm hover:bg-slate-50"
                        : "bg-slate-950 border-slate-800 text-white shadow-xl hover:bg-black"
                )}
            >
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            "w-2 h-2 rounded-full",
                            isGlobal ? "" : "shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        )}
                        style={{ backgroundColor: currentProject?.brandColor || '#3b82f6' }}
                    />
                    <span className={cn(
                        "text-xs font-black uppercase tracking-tight",
                        isGlobal ? "text-slate-900" : "text-slate-100"
                    )}>
                        {currentProject?.name || 'Выберите проект'}
                    </span>
                </div>
                <ChevronDown size={14} className={cn(
                    "transition-transform",
                    isGlobal ? "text-slate-400" : "text-slate-500",
                    isOpen ? 'rotate-180' : ''
                )} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full mt-2 left-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
                        <div className="p-2 border-b border-slate-50">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1">Ваши проекты</div>
                        </div>
                        <div className="p-1 max-h-64 overflow-y-auto">
                            {/* Global Option */}
                            <button
                                onClick={() => handleSelect('all')}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${currentProjectId === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded-md">
                                        <Globe size={12} />
                                    </div>
                                    <span className="text-xs font-black uppercase">Все проекты</span>
                                </div>
                                {currentProjectId === 'all' && <Check size={14} className="text-blue-600" />}
                            </button>

                            <div className="h-px bg-slate-50 my-1" />

                            {allProjects.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelect(p.id)}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${p.id === currentProjectId ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: p.brandColor }}
                                        />
                                        <span className="text-xs font-bold">{p.name}</span>
                                    </div>
                                    {p.id === currentProjectId && <Check size={14} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
