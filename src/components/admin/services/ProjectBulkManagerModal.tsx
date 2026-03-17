'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { X, Globe, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getServiceProjectStatuses, bulkToggleServiceInProjects } from '@/app/admin/services/actions';

interface ProjectStatus {
    id: string;
    name: string;
    isActive: boolean;
}

interface ProjectBulkManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: any;
    onSuccess?: () => void;
}

export function ProjectBulkManagerModal({ isOpen, onClose, service, onSuccess }: ProjectBulkManagerModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [projects, setProjects] = useState<ProjectStatus[]>([]);
    const [changedSettings, setChangedSettings] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isOpen && service) {
            loadStatuses();
        }
    }, [isOpen, service]);

    async function loadStatuses() {
        setLoading(true);
        try {
            const data = await getServiceProjectStatuses(service.id);
            setProjects(data);
            setChangedSettings({}); // Сброс изменений при загрузке новых данных
        } catch (error) {
            toast.error('Не удалось загрузить статусы проектов');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const toggleProject = (projectId: string, current: boolean) => {
        const newValue = !current;
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isActive: newValue } : p));
        setChangedSettings(prev => ({ ...prev, [projectId]: newValue }));
    };

    const handleSave = async () => {
        if (Object.keys(changedSettings).length === 0) {
            onClose();
            return;
        }

        setSaving(true);
        try {
            const res = await bulkToggleServiceInProjects(service.id, changedSettings);
            if (res.success) {
                toast.success('Статусы в проектах обновлены');
                onSuccess?.();
                onClose();
            } else {
                toast.error('Ошибка: ' + res.error);
            }
        } catch (error: any) {
            toast.error('Сбой при сохранении: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleAll = (active: boolean) => {
        const newSettings: Record<string, boolean> = {};
        setProjects(prev => prev.map(p => {
            newSettings[p.id] = active;
            return { ...p, isActive: active };
        }));
        setChangedSettings(newSettings);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-white/20">
                {/* Header */}
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Globe size={20} className="text-blue-400" />
                            Проекты: {service?.name}
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            Управление видимостью услуги в доступных проектах
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={24} className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => toggleAll(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/10 active:scale-95"
                        >
                            Включить во всех
                        </button>
                        <button 
                             onClick={() => toggleAll(false)}
                            className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-300 transition-all active:scale-95"
                        >
                            Выключить везде
                        </button>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase">
                            <Loader2 size={14} className="animate-spin" />
                            Загрузка...
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
                    {projects.length === 0 && !loading && (
                        <div className="text-center py-20 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                <Globe size={32} />
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                Нет доступных для вас проектов
                            </p>
                        </div>
                    )}
                    
                    {projects.map(project => (
                        <div 
                            key={project.id}
                            onClick={() => toggleProject(project.id, project.isActive)}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                                project.isActive 
                                ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/5' 
                                : 'bg-slate-50 border-slate-100 hover:border-slate-200 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                    project.isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-white text-slate-400 border border-slate-100'
                                }`}>
                                    <Globe size={22} />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-black uppercase tracking-tight ${project.isActive ? 'text-blue-900' : 'text-slate-500'}`}>
                                        {project.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold font-mono">ID: {project.id}</p>
                                </div>
                            </div>

                            <div className={`w-14 h-7 rounded-full relative transition-all p-1 ${
                                project.isActive ? 'bg-blue-600' : 'bg-slate-300'
                            }`}>
                                <div className={`absolute top-1 bottom-1 w-5 rounded-full bg-white shadow-md transition-all ${
                                    project.isActive ? 'left-8' : 'left-1'
                                }`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-colors">
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading || projects.length === 0}
                        className="px-8 py-3 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider hover:bg-slate-800 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Сохранение...' : 'Применить изменения'}
                    </button>
                </div>
            </div>
        </div>
    );
}
