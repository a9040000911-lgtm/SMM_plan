'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Globe, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
    id: string;
    name: string;
    brandColor: string;
}

interface Props {
    serviceId: string;
    projects: Project[];
    initialEnabledIds: string[];
}

export function ProjectVisibilityManager({ serviceId, projects, initialEnabledIds }: Props) {
    const [enabledIds, setEnabledIds] = useState<string[]>(initialEnabledIds);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const toggleProject = async (projectId: string) => {
        const isEnabled = enabledIds.includes(projectId);
        const nextIds = isEnabled
            ? enabledIds.filter(id => id !== projectId)
            : [...enabledIds, projectId];

        setIsUpdating(projectId);
        try {
            const res = await fetch(`/api/admin/services/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId,
                    projectIds: nextIds
                })
            });

            if (res.ok) {
                setEnabledIds(nextIds);
                toast.success(isEnabled ? 'Скрыто в проекте' : 'Добавлено в проект');
            } else {
                toast.error('Ошибка обновления видимости');
            }
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
            toast.error('Ошибка сети');
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe size={14} className="text-blue-500" />
                    Доступность в проектах
                </h4>
            </div>

            <div className="p-3 space-y-1.5">
                {projects.map(p => {
                    const isActive = enabledIds.includes(p.id);
                    const loading = isUpdating === p.id;

                    return (
                        <button
                            key={p.id}
                            onClick={() => toggleProject(p.id)}
                            disabled={!!isUpdating}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${isActive
                                    ? 'bg-blue-50/50 border-blue-100 text-blue-700'
                                    : 'bg-transparent border-slate-100 text-slate-400 hover:border-slate-200'
                                }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: p.brandColor }}
                                />
                                <span className="text-[10px] font-black uppercase tracking-tight truncate">
                                    {p.name}
                                </span>
                            </div>

                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-transparent'
                                }`}>
                                {loading ? <Loader2 size={10} className="animate-spin text-white" /> : <Check size={12} />}
                            </div>
                        </button>
                    );
                })}

                {projects.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-slate-400 font-bold italic">
                        Проекты не найдены
                    </div>
                )}
            </div>
            <div className="p-3 bg-slate-50/50 border-t border-slate-50">
                <p className="text-[9px] text-slate-400 leading-tight font-medium italic">
                    Выберите, где услуга будет видна клиентам. Сохраняется мгновенно.
                </p>
            </div>
        </div>
    );
}
