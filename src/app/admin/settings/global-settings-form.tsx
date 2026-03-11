'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Shield, Save, AlertCircle, Info } from 'lucide-react';
import { updateGlobalSettingsAction } from './global-settings-actions';
import { toast } from 'sonner';

interface GlobalSettingsFormProps {
    initialSettings: Record<string, string>;
}

export function GlobalSettingsForm({ initialSettings }: GlobalSettingsFormProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateGlobalSettingsAction(settings);
        setIsSaving(false);

        if (res.success) {
            toast.success('Настройки успешно обновлены');
        } else {
            toast.error('Ошибка: ' + res.error);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-lg">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Безопасность и Лимиты</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Глобальные настройки платформы</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-900/20 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Auth Limiter */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Лимит авторизации (запросов/мин)
                                <div className="group relative">
                                    <Info size={12} className="text-slate-300 cursor-help" />
                                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                        Защита от подбора паролей. Рекомендуемое значение: 30-60.
                                    </div>
                                </div>
                            </label>
                            <input
                                type="number"
                                value={settings.LIMIT_AUTH || '60'}
                                onChange={(e) => handleChange('LIMIT_AUTH', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* API Limiter */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Лимит API (запросов/мин)
                                <div className="group relative">
                                    <Info size={12} className="text-slate-300 cursor-help" />
                                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                        Для внутренних API запросов (клиентские запросы, TMA). Рекомендуемое значение: 100-200.
                                    </div>
                                </div>
                            </label>
                            <input
                                type="number"
                                value={settings.LIMIT_API || '150'}
                                onChange={(e) => handleChange('LIMIT_API', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Public Limiter */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Лимит на публичные страницы (запросов/мин)
                                <div className="group relative">
                                    <Info size={12} className="text-slate-300 cursor-help" />
                                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                        Обычный просмотр страниц фронтенда. Рекомендуемое значение: 200-500.
                                    </div>
                                </div>
                            </label>
                            <input
                                type="number"
                                value={settings.LIMIT_PUBLIC || '300'}
                                onChange={(e) => handleChange('LIMIT_PUBLIC', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-4">
                        <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm self-start">
                            <AlertCircle size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Важное примечание</p>
                            <p className="text-[11px] font-medium text-blue-800 leading-relaxed">
                                Глобальные администраторы (владельцы платформы) полностью игнорируют эти лимиты.
                                Изменения вступают в силу в течение 30 секунд после сохранения.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
