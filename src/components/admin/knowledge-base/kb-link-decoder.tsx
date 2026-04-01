"use client";

import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, AlertCircle, CheckCircle2, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import { analyzeLink, mapObjectTypeToTargetType, AnalysisResult } from '@/utils/link-analyzer';

export function KBLinkDecoder() {
    const [inputUrl, setInputUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null | undefined>(undefined);
    const [targetType, setTargetType] = useState<string | null>(null);

    const handleAnalyze = () => {
        if (!inputUrl.trim()) {
            setResult(undefined);
            return;
        }

        setIsAnalyzing(true);
        // Simulate deep analysis delay for psychological effect
        setTimeout(() => {
            const analysis = analyzeLink(inputUrl.trim());
            setResult(analysis);
            if (analysis) {
                setTargetType(mapObjectTypeToTargetType(analysis.objectType));
            } else {
                setTargetType(null);
            }
            setIsAnalyzing(false);
        }, 600);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAnalyze();
        }
    };

    const getExplanation = (analysis: AnalysisResult | null, target: string | null) => {
        if (!analysis) return "Система не смогла распознать ссылку. Либо это неизвестная платформа, либо формат ссылки сломан. Попросите клиента прислать корректную ссылку, открывающуюся в браузере.";

        if (target === 'CHANNEL' || target === 'PROFILE') {
            return `Эта ссылка ведет на профиль/канал (${analysis.objectType}). Сюда можно заказывать только глобальные услуги: подписчиков, друзей, вступления в группу. Нельзя заказывать лайки или просмотры, так как система не знает, на какой именно пост их ставить.`;
        }
        if (target === 'POST' || target === 'VIDEO' || target === 'STORY' || target === 'COMMENT') {
            return `Эта ссылка ведет на конкретную единицу контента (${analysis.objectType}). Сюда можно заказывать только локальную активность: лайки, просмотры, репосты, комментарии. Нельзя заказывать подписчиков, так как подписчики идут на весь профиль целиком, а не на один пост.`;
        }
        if (target === 'EXTERNAL' || target === 'CUSTOM') {
            return `Эта ссылка имеет специфичный или внешний формат (${analysis.objectType}). Такие ссылки используются для ботов, приватных инвайтов, закрытых плейлистов или жалоб. Внимательно читайте описание услуги Провайдера.`;
        }
        return `Стандартная ссылка. Разрешенные категории: ${analysis.possibleCategories.join(', ')}`;
    };

    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-10 shadow-xl relative overflow-hidden text-white border border-slate-800">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pattern-grid-lg"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl">
                        <LinkIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-white">Neuro Декодер Ссылок</h2>
                        <p className="text-sm font-medium text-slate-400">Вставьте проблемную ссылку клиента, чтобы увидеть её "глазами бэкенда".</p>
                    </div>
                </div>

                <div className="mt-8 relative flex shadow-2xl rounded-2xl bg-white/5 border border-white/10 p-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-slate-500 rounded-xl focus:ring-0 focus:outline-none sm:text-lg font-medium"
                        placeholder="Например: https://t.me/durov/123"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        spellCheck="false"
                        autoComplete="off"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !inputUrl.trim()}
                        className="ml-2 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                        {isAnalyzing ? (
                            <><RefreshCw className="animate-spin" size={20} /> Анализ...</>
                        ) : (
                            <>Декодировать <ChevronRight size={20} /></>
                        )}
                    </button>
                </div>

                {/* Results Section */}
                <div className="mt-6 min-h-[150px]">
                    {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-10 opacity-60">
                            <Layers className="animate-bounce mb-4 text-blue-400" size={32} />
                            <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Neural parsing patterns...</p>
                        </div>
                    )}

                    {!isAnalyzing && result !== undefined && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {result === null ? (
                                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                                    <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={24} />
                                    <div>
                                        <h4 className="text-lg font-bold text-red-200">Invalid Link Format</h4>
                                        <p className="text-sm text-red-300 mt-1">{getExplanation(null, null)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Platform */}
                                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Platform</div>
                                            <div className="text-xl font-bold text-white capitalize">{result.platform.toLowerCase()}</div>
                                        </div>

                                        {/* Object Type */}
                                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Object Type (API)</div>
                                            <div className="text-xl font-bold text-blue-400">{result.objectType}</div>
                                        </div>

                                        {/* Target Mapping */}
                                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Target Mapping (DB)</div>
                                            <div className="text-xl font-bold text-emerald-400">{targetType}</div>
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Allowed Categories (InstantOrder.tsx)</div>
                                        <div className="flex flex-wrap gap-2">
                                            {result.possibleCategories.map(cat => (
                                                <span key={cat} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-4">
                                        <CheckCircle2 className="text-blue-400 shrink-0 mt-0.5" size={24} />
                                        <div>
                                            <h4 className="text-base font-bold text-blue-200">Вывод для Саппорта</h4>
                                            <p className="text-sm text-blue-100/70 mt-1 leading-relaxed">{getExplanation(result, targetType)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
