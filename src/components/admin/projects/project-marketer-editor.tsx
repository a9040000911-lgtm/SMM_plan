'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import {
    Zap,
    ShieldCheck,
    Clock,
    Layers,
    Info,
    Save
} from 'lucide-react';
import { updateMarketerSettingsAction } from '@/app/admin/projects/[id]/actions';
import { toast } from 'sonner';
import Link from 'next/link';

interface MarketerSettings {
    isVipFailoverEnabled: boolean;
    isNaturalRecoveryEnabled: boolean;
    isSmartFragmentationEnabled: boolean;
    defaultDelayMinutes: number;
}

interface ProjectMarketerEditorProps {
    projectId: string;
    initialSettings?: MarketerSettings | any;
}

export function ProjectMarketerEditor({ projectId, initialSettings }: ProjectMarketerEditorProps) {
    const [settings, setSettings] = useState<MarketerSettings>({
        isVipFailoverEnabled: initialSettings?.isVipFailoverEnabled || false,
        isNaturalRecoveryEnabled: initialSettings?.isNaturalRecoveryEnabled || false,
        isSmartFragmentationEnabled: initialSettings?.isSmartFragmentationEnabled || false,
        defaultDelayMinutes: initialSettings?.defaultDelayMinutes || 0
    });

    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await updateMarketerSettingsAction(projectId, settings);
            if (res.success) {
                toast.success('Настройки маркетолога обновлены!');
            }
        } catch (err) {
            toast.error('Ошибка сохранения настроек');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggle = (key: keyof MarketerSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-10">
            {/* Header / Info */}
            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                    <Info size={18} />
                </div>
                <div className="space-y-1">
                    <h4 className="font-black text-slate-800 text-sm">Настройка интеллекта проекта</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Эти параметры определяют поведение системы при обработке заказов. Каждая функция подробно описана в <Link href="/admin/knowledge-base#marketer" className="text-blue-600 underline font-bold">Базе Знаний</Link>.
                    </p>
                </div>
            </div>

            {/* Settings Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Failover */}
                <div className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer group ${settings.isVipFailoverEnabled ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`} onClick={() => toggle('isVipFailoverEnabled')}>
                    <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl ${settings.isVipFailoverEnabled ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'}`}>
                            <ShieldCheck size={24} />
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${settings.isVipFailoverEnabled ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.isVipFailoverEnabled ? 'left-7' : 'left-1'}`} />
                        </div>
                    </div>
                    <h3 className="font-black text-slate-800 mb-2">Безотказный Failover</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Автоматический перезапуск через резервных провайдеров.</p>
                </div>

                {/* 2. Recovery */}
                <div className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer group ${settings.isNaturalRecoveryEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-slate-200'}`} onClick={() => toggle('isNaturalRecoveryEnabled')}>
                    <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl ${settings.isNaturalRecoveryEnabled ? 'bg-white text-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'}`}>
                            <Clock size={24} />
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${settings.isNaturalRecoveryEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.isNaturalRecoveryEnabled ? 'left-7' : 'left-1'}`} />
                        </div>
                    </div>
                    <h3 className="font-black text-slate-800 mb-2">Natural Recovery</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Плавное восстановление (Drip-Feed) при оттоке подписчиков.</p>
                </div>

                {/* 3. Fragmentation */}
                <div className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer group ${settings.isSmartFragmentationEnabled ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 hover:border-slate-200'}`} onClick={() => toggle('isSmartFragmentationEnabled')}>
                    <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl ${settings.isSmartFragmentationEnabled ? 'bg-white text-amber-600 shadow-sm' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'}`}>
                            <Layers size={24} />
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${settings.isSmartFragmentationEnabled ? 'bg-amber-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.isSmartFragmentationEnabled ? 'left-7' : 'left-1'}`} />
                        </div>
                    </div>
                    <h3 className="font-black text-slate-800 mb-2">Smart Fragmentation</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Дробление крупных заказов на безопасные порции.</p>
                </div>

                {/* 4. Delay Pacing */}
                <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-transparent">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-white rounded-2xl text-slate-500 shadow-sm">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-sm italic">Smart Pacing</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Автозапуск (мин)</p>
                        </div>
                    </div>
                    <input
                        type="number"
                        value={settings.defaultDelayMinutes}
                        onChange={(e) => setSettings(prev => ({ ...prev, defaultDelayMinutes: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 font-black text-xl text-slate-800 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Авто-сохранение не активно</span>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    Сохранить стратегию
                </button>
            </div>
        </div>
    );
}


