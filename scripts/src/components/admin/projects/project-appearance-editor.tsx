'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/admin/ui';
import { Save, MessageSquare, HelpCircle, Mail, User as UserIcon } from 'lucide-react';
import { updateProjectConfigAction } from '@/app/admin/projects/actions';
import { toast } from 'sonner';

interface ProjectAppearanceEditorProps {
    projectId: string;
    initialConfig: any;
}

export function ProjectAppearanceEditor({ projectId, initialConfig }: ProjectAppearanceEditorProps) {
    const [config, setConfig] = useState(() => ({
        managerId: initialConfig?.managerId || '',
        supportBot: initialConfig?.supportBot || '',
        supportEmail: initialConfig?.supportEmail || 'support@smmplan.ru',
        enableBugReporter: initialConfig?.enableBugReporter ?? true,
        enableReviews: initialConfig?.enableReviews ?? true,
    }));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialConfig) {
            setConfig({
                managerId: initialConfig.managerId || '',
                supportBot: initialConfig.supportBot || '',
                supportEmail: initialConfig.supportEmail || 'support@smmplan.ru',
                enableBugReporter: initialConfig.enableBugReporter ?? true,
                enableReviews: initialConfig.enableReviews ?? true,
            });
        }
    }, [initialConfig]);

    const updateSupportSetting = (key: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProjectConfigAction(projectId, config);
            toast.success('Настройки поддержки сохранены!');
        } catch {
            toast.error('Ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                        <HelpCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">Поддержка и Контакты</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Настройки связи на сайте и в боте</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2 bg-slate-900 text-white">
                    <Save size={14} />
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-2">ID Личного менеджера</span>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <UserIcon size={14} />
                            </div>
                            <input
                                type="text"
                                value={config.managerId || ''}
                                onChange={(e) => updateSupportSetting('managerId', e.target.value)}
                                placeholder="@username или ID"
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-2">Бот техподдержки (для сайта)</span>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <MessageSquare size={14} />
                            </div>
                            <input
                                type="text"
                                value={config.supportBot || ''}
                                onChange={(e) => updateSupportSetting('supportBot', e.target.value)}
                                placeholder="smmplan_support_bot"
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-mono text-blue-600"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-2">Email для связи</span>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Mail size={14} />
                            </div>
                            <input
                                type="email"
                                value={config.supportEmail || ''}
                                onChange={(e) => updateSupportSetting('supportEmail', e.target.value)}
                                placeholder="support@smmplan.ru"
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="md:col-span-2 overflow-hidden rounded-2xl border border-slate-200 divide-y divide-slate-100">
                        <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Виджет баг-репортов</h4>
                                <p className="text-xs text-slate-500">Показывает кнопку "Нашли баг?" на клиентской стороне.</p>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.enableBugReporter}
                                    onChange={(e) => updateSupportSetting('enableBugReporter', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Виджет отзывов</h4>
                                <p className="text-xs text-slate-500">Показывает плавающую кнопку для отзывов клиентов.</p>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.enableReviews}
                                    onChange={(e) => updateSupportSetting('enableReviews', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
