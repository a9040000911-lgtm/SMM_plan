'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Globe, Briefcase, Settings } from 'lucide-react';
import { getProvidersAction } from '@/app/admin/providers/actions';
import { AdminProvider } from '@/types/admin';
import { ProjectProviderModal } from './project-provider-modal';

export function ProjectProvidersTab({ projectId }: { projectId: string }) {
    const [providers, setProviders] = useState<AdminProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<AdminProvider | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProviders = async () => {
        setIsLoading(true);
        try {
            const allProviders = await getProvidersAction();
            // Filter only global or this project's providers
            setProviders(allProviders.filter(p => !p.projectId || p.projectId === projectId));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, [projectId]);

    if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">API Провайдеры проекта</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Глобальные ключи + индивидуальные переопределения для этого сайта</p>
                </div>
                <button
                    onClick={() => { setSelectedProvider(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                    <Plus size={14} />
                    Добавить ключ проекта
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {providers.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${!p.projectId ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                                {!p.projectId ? <Globe size={20} /> : <Briefcase size={20} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-800 uppercase tracking-tight">{p.name}</span>
                                    {!p.projectId ?
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase border border-slate-200">Глобальный</span> :
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-black uppercase border border-blue-200">Проектный</span>
                                    }
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.apiUrl}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.projectId && (
                                <button
                                    onClick={() => { setSelectedProvider(p); setIsModalOpen(true); }}
                                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    <Settings size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <ProjectProviderModal
                    projectId={projectId}
                    provider={selectedProvider}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchProviders}
                />
            )}
        </div>
    );
}
