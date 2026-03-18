'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useMemo } from 'react';
import { 
    X, Search, Plus, Loader2, BookOpen, Layers, Filter 
} from 'lucide-react';
import { activateServiceInProject } from '@/app/admin/services/actions';
import { toast } from 'sonner';
import { Platform } from '@/generated/client';

interface ServiceLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    allServices: any[];
    activeProjectId: string;
    existingServiceIds: string[];
}

export function ServiceLibraryModal({ 
    isOpen, 
    onClose, 
    allServices, 
    activeProjectId,
    existingServiceIds 
}: ServiceLibraryModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
    const [isActivating, setIsActivating] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return allServices.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.includes(searchTerm);
            const matchesPlatform = filterPlatform === 'ALL' || s.platform === filterPlatform;
            const isNotAdded = !existingServiceIds.includes(s.id);
            return matchesSearch && matchesPlatform && isNotAdded;
        });
    }, [allServices, searchTerm, filterPlatform, existingServiceIds]);

    const handleActivate = async (serviceId: string) => {
        setIsActivating(serviceId);
        try {
            const res = await activateServiceInProject(serviceId, activeProjectId);
            if (res.success) {
                toast.success('Услуга добавлена в ваш проект');
            } else {
                toast.error((res as any).error || 'Ошибка активации');
            }
        } catch (_e) {
            toast.error('Ошибка сети');
        } finally {
            setIsActivating(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Библиотека услуг</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Выберите тарифы для активации в вашем проекте</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                </div>

                {/* Toolbar */}
                <div className="p-6 bg-white border-b border-slate-50 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Поиск по названию или ID..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 ring-blue-500/5 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400 hidden md:block" />
                        <select 
                            value={filterPlatform}
                            onChange={(e) => setFilterPlatform(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 ring-blue-500/5"
                        >
                            <option value="ALL">Все платформы</option>
                            {Object.keys(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map(service => (
                            <div key={service.id} className="p-5 rounded-3xl border border-slate-100 bg-slate-50/30 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase text-blue-600/70">{service.platform}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-bold text-slate-400">{service.category}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1">{service.name}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded uppercase">ID: {service.id}</span>
                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">{service.pricePer1000}₽ / 1k</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleActivate(service.id)}
                                        disabled={isActivating === service.id}
                                        className="shrink-0 p-3 bg-white border border-slate-200 rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                    >
                                        {isActivating === service.id ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center">
                            <Layers size={48} className="text-slate-100 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Услуг не найдено</p>
                            <p className="text-xs text-slate-300 mt-1 uppercase font-bold">Либо все услуги уже добавлены, либо измените фильтр</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-50 bg-slate-50/30 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Всего доступно в библиотеке: {allServices.length} услуг
                    </p>
                </div>
            </div>
        </div>
    );
}


