"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button } from '@/components/admin/ui';
import { UserPlus, X, Loader2, ShieldCheck, Mail, User, Key, Globe, Check } from 'lucide-react';
import { createEmployeeAction } from '@/app/admin/employees/actions';

interface CreateEmployeeModalProps {
    allProjects: { id: string; name: string; }[];
}

const TABS = [
    { id: 'dashboard', name: 'Панель (Admin)' },
    { id: 'projects', name: 'Проекты (Платформы)' },
    { id: 'support', name: 'Тикеты (Поддержка)' },
    { id: 'orders', name: 'Заказы' },
    { id: 'transactions', name: 'Транзакции' },
    { id: 'reports', name: 'Отчеты' },
    { id: 'expenses', name: 'Расходы' },
    { id: 'users', name: 'Пользователи' },
    { id: 'employees', name: 'Сотрудники' },
    { id: 'services', name: 'Услуги (Каталог)' },
    { id: 'health', name: 'Здоровье услуг' },
    { id: 'markup', name: 'Наценка' },
    { id: 'import', name: 'Импорт услуг' },
    { id: 'providers', name: 'Провайдеры' },
    { id: 'news', name: 'Новости' },
    { id: 'loyalty', name: 'Лояльность' },
    { id: 'settings', name: 'Настройки' },
    { id: 'logs', name: 'Логи' },
];

export function CreateEmployeeModal({ allProjects }: CreateEmployeeModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'projects' | 'tabs'>('projects');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'SUPPORT',
        isGlobalAdmin: false,
        projectIds: [] as string[],
        allowedTabs: [] as string[]
    });

    const toggleProject = (projectId: string) => {
        setFormData(prev => ({
            ...prev,
            projectIds: prev.projectIds.includes(projectId)
                ? prev.projectIds.filter(id => id !== projectId)
                : [...prev.projectIds, projectId]
        }));
    };

    const toggleTab = (tabId: string) => {
        setFormData(prev => ({
            ...prev,
            allowedTabs: prev.allowedTabs.includes(tabId)
                ? prev.allowedTabs.filter(id => id !== tabId)
                : [...prev.allowedTabs, tabId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.isGlobalAdmin && formData.projectIds.length === 0) {
            setError('Выберите хотя бы один проект или сделайте сотрудника глобальным админом');
            return;
        }

        if (!formData.isGlobalAdmin && formData.allowedTabs.length === 0) {
            setError('Выберите хотя бы одну вкладку для доступа');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const result = await createEmployeeAction(formData);
            if (result.success) {
                setIsOpen(false);
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    role: 'SUPPORT',
                    isGlobalAdmin: false,
                    projectIds: [],
                    allowedTabs: []
                });
            }
        } catch (err: any) {
            setError(err.message || 'Ошибка создания');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2"
            >
                <UserPlus size={16} />
                Добавить сотрудника
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white w-full max-w-md my-auto rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Новый сотрудник</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Регистрация в системе управления</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold uppercase tracking-tight">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <User size={16} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="admin_ivan"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none"
                                        value={formData.username}
                                        onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Роль</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none appearance-none"
                                    value={formData.role}
                                    onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                >
                                    <option value="SUPPORT">SUPPORT</option>
                                    <option value="SEO">SEO</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail size={16} />
                                </div>
                                <input
                                    required
                                    type="email"
                                    placeholder="ivan@smmplan.ru"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Key size={16} />
                                </div>
                                <input
                                    required
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none"
                                    value={formData.password}
                                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isGlobalAdmin: !prev.isGlobalAdmin }))}
                                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${formData.isGlobalAdmin
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.isGlobalAdmin ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}`}>
                                        <Globe size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-black uppercase tracking-tight">Глобальный администратор</p>
                                        <p className="text-[10px] opacity-60 font-medium">Безусловный доступ ко всем проектам и вкладкам</p>
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.isGlobalAdmin ? 'bg-rose-500 border-rose-500' : 'border-slate-300'}`}>
                                    {formData.isGlobalAdmin && <Check size={12} className="text-white" />}
                                </div>
                            </button>
                        </div>

                        {!formData.isGlobalAdmin && (
                            <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setActiveView('projects')}
                                        className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${activeView === 'projects' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Проекты ({formData.projectIds.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveView('tabs')}
                                        className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${activeView === 'tabs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Вкладки ({formData.allowedTabs.length})
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                    {activeView === 'projects' ? (
                                        allProjects.map(project => (
                                            <button
                                                key={project.id}
                                                type="button"
                                                onClick={() => toggleProject(project.id)}
                                                className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-between gap-2 ${formData.projectIds.includes(project.id)
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                                    }`}
                                            >
                                                <span className="truncate">{project.name}</span>
                                                {formData.projectIds.includes(project.id) && <Check size={12} />}
                                            </button>
                                        ))
                                    ) : (
                                        TABS.map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => toggleTab(tab.id)}
                                                className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-between gap-2 ${formData.allowedTabs.includes(tab.id)
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                                    }`}
                                            >
                                                <span className="truncate">{tab.name}</span>
                                                {formData.allowedTabs.includes(tab.id) && <Check size={12} />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Отмена
                        </button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-4 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Создание...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    Подтвердить
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
