'use client';

import React, { useState } from 'react';
import { Sparkles, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisResult {
    email: string | null;
    category: string;
    stealth_offer: string;
    interest_profile: string;
}

export function SupportAIAnalysis({ ticketId }: { ticketId: string }) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [copied, setCopied] = useState(false);

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/support/tickets/${ticketId}/analyze`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.success) {
                setAnalysis(data.analysis);
                toast.success('Анализ завершен успешно');
            } else {
                toast.error(data.error || 'Ошибка анализа');
            }
        } catch (e) {
            toast.error('Сетевая ошибка при анализе');
        } finally {
            setLoading(false);
        }
    };

    const copyOffer = () => {
        if (!analysis?.stealth_offer) return;
        navigator.clipboard.writeText(analysis.stealth_offer);
        setCopied(true);
        toast.success('Оффер скопирован');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-500" />
                AI Анализ интересов
            </h4>

            {!analysis ? (
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-black uppercase transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Анализируем...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            Анализировать диалог
                        </>
                    )}
                </button>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-md">
                        <div className="text-[9px] font-bold text-purple-400 uppercase mb-1">Категория</div>
                        <div className="text-sm font-black text-purple-900">{analysis.category}</div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                        <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Профиль интересов</div>
                        <div className="text-[11px] text-slate-700 leading-relaxed italic">
                            {analysis.interest_profile}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                            <span>Стелс-Оффер</span>
                            <button 
                                onClick={copyOffer}
                                className="text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                {copied ? 'Готово' : 'Копировать'}
                            </button>
                        </div>
                        <div className="p-4 bg-slate-900 text-white rounded-md text-[11px] leading-relaxed font-medium border-l-4 border-purple-500">
                            {analysis.stealth_offer}
                        </div>
                    </div>

                    <button
                        onClick={() => setAnalysis(null)}
                        className="w-full text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase transition-colors"
                    >
                        Сбросить и пересчитать
                    </button>
                </div>
            )}

            <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-100 rounded text-[9px] text-yellow-700 leading-tight">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>
                    Используйте этот оффер при ответе клиенту. <br />
                    <b>ПРАВИЛО:</b> Мы не упоминаем проблемы конкурента.
                </span>
            </div>
        </div>
    );
}
