'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface TwoFactorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (code: string) => void;
    isPending: boolean;
}

export function TwoFactorModal({ isOpen, onClose, onSubmit, isPending }: TwoFactorModalProps) {
    const [code, setCode] = useState('');

    if (!isOpen) return null;

    return (
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
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-xl">
                    Мы отправили код подтверждения в ваш Telegram. Введите его ниже для сохранения изменений.
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(code); }} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
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
    );
}


