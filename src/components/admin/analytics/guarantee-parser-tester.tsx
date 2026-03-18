'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { parseGuaranteeAction } from '@/app/admin/analytics/churn/actions';

export function GuaranteeParserTester() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<number | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    const handleTest = async () => {
        if (!input.trim()) return;
        setIsBusy(true);
        try {
            const days = await parseGuaranteeAction(input);
            setResult(days);
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mt-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                Тестер определения гарантии
            </h3>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Вставьте название или описание услуги (например: 'Instagram Followers R30')"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
                <button
                    onClick={handleTest}
                    disabled={isBusy || !input.trim()}
                    className="px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                    {isBusy ? 'Анализ...' : 'Проверить'}
                </button>
            </div>

            {result !== null && (
                <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 ${result > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                    {result > 0 ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase opacity-70">Результат</span>
                        <span className="font-bold">
                            {result > 0 ? `Обнаружена гарантия: ${result} дней` : 'Гарантия не обнаружена (0 дней)'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}


