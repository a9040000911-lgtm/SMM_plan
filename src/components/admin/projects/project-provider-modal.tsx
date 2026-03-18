'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { createProviderAction, updateProviderAction, deleteProviderAction } from '@/app/admin/providers/actions';
import { AdminProvider } from '@/types/admin';
import { MetadataBuilder } from '@/components/admin/providers/metadata-builder';
import { toast } from 'sonner';

interface ProjectProviderModalProps {
    projectId: string;
    provider?: AdminProvider | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProjectProviderModal({ projectId, provider, onClose, onSuccess }: ProjectProviderModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const [formData, setFormData] = useState({
        id: provider?.id || '',
        name: provider?.name || '',
        apiKey: provider?.apiKey || '',
        apiUrl: provider?.apiUrl || '',
        isEnabled: provider?.isEnabled ?? true,
        balanceThreshold: provider?.balanceThreshold !== undefined ? provider.balanceThreshold.toString() : '1000',
        type: provider?.type || 'universal',
        metadata: JSON.stringify(provider?.metadata || {}, null, 2),
        balanceCurrency: provider?.balanceCurrency || 'RUB',
        pricesCurrency: provider?.pricesCurrency || 'RUB'
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const threshold = parseFloat(formData.balanceThreshold) || 1000;
            const dataToSave = {
                name: formData.name,
                type: formData.type,
                apiKey: formData.apiKey,
                apiUrl: formData.apiUrl,
                isEnabled: formData.isEnabled,
                balanceThreshold: threshold,
                metadata: JSON.parse(formData.metadata || '{}'),
                balanceCurrency: formData.balanceCurrency,
                pricesCurrency: formData.pricesCurrency,
                verificationCode: verificationCode || undefined
            };

            let res;
            if (provider?.id) {
                res = await updateProviderAction(provider.id, dataToSave);
            } else {
                res = await createProviderAction({ ...dataToSave, projectId });
            }

            if (res.success) {
                toast.success(provider?.id ? 'Провайдер обновлен' : 'Провайдер создан');
                onSuccess();
                onClose();
            } else if ((res as any).requires2FA) {
                setRequires2FA(true);
                toast.info('Требуется код подтверждения из Telegram');
            } else {
                toast.error(res.error || 'Ошибка восстановления');
            }
        } catch (e) {
            console.error(e);
            toast.error('Ошибка сети или формата данных');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!provider?.id || !confirm('Удалить этого провайдера?')) return;
        setIsDeleting(true);
        try {
            const res = await deleteProviderAction(provider.id);
            if (res.success) {
                toast.success('Провайдер удален');
                onSuccess();
                onClose();
            } else {
                toast.error(res.error || 'Ошибка удаления');
            }
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
            toast.error('Ошибка сети');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <h3 className="font-black text-slate-800 uppercase italic">
                        {provider ? 'Настройки ключа' : 'Новый ключ проекта'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Название (ID в системе)</label>
                        <input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="VEXBOOST"
                            disabled={!!provider?.id}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none uppercase disabled:opacity-50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Тип драйвера</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                            >
                                <option value="universal">Universal (Custom)</option>
                                <option value="perfect-panel">Perfect Panel (Standard)</option>
                                <option value="vexboost">VexBoost</option>
                                <option value="stream-promotion">Stream Promotion</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Порог уведомления (₽)</label>
                            <input
                                type="number"
                                required
                                value={formData.balanceThreshold}
                                onChange={e => setFormData({ ...formData, balanceThreshold: e.target.value })}
                                placeholder="1000"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API Endpoint URL</label>
                        <input
                            required
                            value={formData.apiUrl}
                            onChange={e => setFormData({ ...formData, apiUrl: e.target.value })}
                            placeholder="https://provider.com/api/v2"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API Ключ провайдера</label>
                        <input
                            type="password"
                            required
                            value={formData.apiKey}
                            onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                            placeholder="Вставьте ваш API ключ"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>

                    {requires2FA && (
                        <div className="space-y-1.5 p-4 bg-amber-50 rounded-2xl border border-amber-200 animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-black text-amber-700 uppercase ml-1">Код подтверждения (Telegram)</label>
                            <input
                                type="text"
                                required
                                value={verificationCode}
                                onChange={e => setVerificationCode(e.target.value)}
                                placeholder="000000"
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-center text-lg font-black tracking-[0.5em] focus:ring-2 focus:ring-amber-500/20 outline-none"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input
                            type="checkbox"
                            id="enabled"
                            checked={formData.isEnabled}
                            onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="enabled" className="text-xs font-bold text-slate-700 cursor-pointer">Активен для этого проекта</label>
                    </div>

                    <MetadataBuilder
                        initialValue={formData.metadata}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, metadata: val }))}
                    />

                    <div className="mt-8 bg-white flex gap-3">
                        {provider && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all flex items-center justify-center shrink-0"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {provider ? 'Сохранить изменения' : 'Создать проектный ключ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


