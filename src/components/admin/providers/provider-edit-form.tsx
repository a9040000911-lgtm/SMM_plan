'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useTransition } from 'react';
import { ArrowLeft, Save, Globe, Key, Type, ToggleRight, Trash2, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { updateProviderAction, deleteProvider } from '@/app/admin/providers/actions';
import { MetadataBuilder } from '@/components/admin/providers/metadata-builder';


interface ProviderEditFormProps {
    provider: any; // Using any for simplicity, effectively AdminProvider
}

export function ProviderEditForm({ provider }: ProviderEditFormProps) {

    const [isPending, startTransition] = useTransition();
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [formDataCache, setFormDataCache] = useState<FormData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Bind the ID to the delete action
    const deleteProviderWithId = deleteProvider.bind(null, provider.id);

    const handleSubmit = async (formData: FormData) => {
        setError(null);

        const data = {
            name: formData.get('name') as string,
            apiUrl: formData.get('apiUrl') as string,
            apiKey: formData.get('apiKey') as string,
            isEnabled: formData.get('isEnabled') === 'on' || formData.get('isEnabled') === 'true',
            type: provider.type, // or extract if added to form
            metadata: JSON.parse(formData.get('metadata') as string || '{}'),
            verificationCode: verificationCode || (formData.get('verificationCode') as string)
        };

        startTransition(async () => {
            try {
                const result = await updateProviderAction(provider.id, data);

                // If the action returned an object, it means redirection didn't happen
                // Check for 2FA requirement
                if (result && result.requires2FA) {
                    setFormDataCache(formData); // Save form data to retry
                    setShow2FAModal(true);
                    return;
                }

                if (result && result.error) {
                    setError(result.error);
                    return;
                }

                // If success, we manually redirect because updateProviderAction 
                // doesn't redirect (it's the low-level action)
                if (result && result.success) {
                    window.location.href = '/admin/providers';
                }
            } catch (e: any) {
                setError(e.message);
            }
        });
    };

    const handle2FASubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formDataCache) return;
        handleSubmit(formDataCache); // Retry with code (state is used inside)
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/providers" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Редактирование провайдера</h2>
                        <p className="text-sm text-slate-500">Обновите API доступы для {provider.name}.</p>
                    </div>
                </div>

                <form action={deleteProviderWithId}>
                    <button
                        type="submit"
                        className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all"
                        title="Удалить провайдера"
                        disabled={isPending}
                    >
                        <Trash2 size={20} />
                    </button>
                </form>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-sm font-medium">
                    Ошибка: {error}
                </div>
            )}

            <form action={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Type size={14} /> Название провайдера
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            defaultValue={provider.name}
                            placeholder="например: VexBoost, GlobalSMM"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Globe size={14} /> URL-адрес API
                        </label>
                        <input
                            name="apiUrl"
                            type="url"
                            required
                            defaultValue={provider.apiUrl}
                            placeholder="https://provider-panel.com/api/v2"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Key size={14} /> API Ключ
                        </label>
                        <input
                            name="apiKey"
                            type="password"
                            required
                            defaultValue={provider.apiKey}
                            placeholder="Ваш секретный API ключ"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono transition-all"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <ToggleRight size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-800">Включить опрос</div>
                                <div className="text-xs text-slate-500">Разрешить системе запрашивать услуги и баланс.</div>
                            </div>
                        </div>
                        <input
                            name="isEnabled"
                            type="checkbox"
                            defaultChecked={provider.isEnabled}
                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <MetadataBuilder
                            name="metadata"
                            initialValue={JSON.stringify(provider.metadata || {}, null, 2)}
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Link
                        href="/admin/providers"
                        className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Отмена
                    </Link>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                    >
                        {isPending ? 'Сохранение...' : (
                            <>
                                <Save size={18} />
                                Обновить провайдера
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* 2FA MODAL */}
            {show2FAModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-800">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Требуется подтверждение</h3>
                                    <p className="text-xs text-slate-500">Критическое изменение настроек</p>
                                </div>
                            </div>
                            <button onClick={() => setShow2FAModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-xl">
                            Мы отправили код подтверждения в ваш Telegram. Введите его ниже для сохранения изменений.
                        </div>

                        <form onSubmit={handle2FASubmit} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="Код из Telegram (6 цифр)"
                                    className="w-full text-center text-2xl tracking-widest font-mono py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    autoFocus
                                    maxLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                            >
                                {isPending ? 'Проверка...' : 'Подтвердить и Сохранить'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


