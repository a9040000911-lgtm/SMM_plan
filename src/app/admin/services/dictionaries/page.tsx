'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 */
import React, { useEffect, useState } from 'react';
import { getDictionaries, addKeyword, deleteKeyword, addProviderRule, deleteProviderRule } from './actions';
import { BookA, Trash2, Plus, Loader2 } from 'lucide-react';
import { CATEGORIES } from '@/services/providers/smart-analyzer.logic';

export default function DictionaryPage() {
    const [loading, setLoading] = useState(true);
    const [dictionaries, setDictionaries] = useState<{ keywords: any[], providerRules: any[] }>({ keywords: [], providerRules: [] });

    // Forms
    const [newKw, setNewKw] = useState('');
    const [newTargetCat, setNewTargetCat] = useState(CATEGORIES[0]);
    const [newWeight, setNewWeight] = useState(50);
    const [isNeg, setIsNeg] = useState(false);

    const [providerId, setProviderId] = useState('');
    const [providerCat, setProviderCat] = useState('');
    const [providerKw, setProviderKw] = useState('');
    const [providerTarget, setProviderTarget] = useState(CATEGORIES[0]);

    useEffect(() => { load() }, []);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getDictionaries();
            setDictionaries(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleAddKw = async () => {
        if (!newKw) return;
        setLoading(true);
        try {
            await addKeyword({ keyword: newKw, category: newTargetCat as any, weight: newWeight, isNegative: isNeg });
            setNewKw('');
            await load();
        } catch (e: any) { alert(e.message); setLoading(false); }
    };

    const handleAddRule = async () => {
        if (!providerId || !providerCat) return;
        setLoading(true);
        try {
            await addProviderRule({ providerId, providerCategory: providerCat, keyword: providerKw, targetCategory: providerTarget as any });
            setProviderKw('');
            await load();
        } catch (e: any) { alert(e.message); setLoading(false); }
    };

    if (loading && dictionaries.keywords.length === 0) return <div className="p-20 text-white flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-10 space-y-10 text-white">
            <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                <BookA className="text-primary" size={32} /> Словари Парсера
            </h1>

            <div className="grid grid-cols-2 gap-10">
                {/* Dictionary Keywords */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold uppercase border-b border-white/10 pb-4">Ключевые слова</h2>
                    
                    <div className="bg-white/5 p-6 rounded-xl space-y-4 border border-white/10">
                        <div className="flex gap-2">
                            <input placeholder="Слово / Фраза" value={newKw} onChange={e => setNewKw(e.target.value)} className="bg-black/40 border border-white/10 rounded px-3 py-1 text-sm flex-1 outline-none" />
                            <select value={newTargetCat} onChange={e => setNewTargetCat(e.target.value)} className="bg-black/40 border border-white/10 rounded px-3 py-1 text-sm outline-none">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4 items-center">
                            Влияние (Очки): 
                            <input type="number" value={newWeight} onChange={e => setNewWeight(Number(e.target.value))} className="bg-black/40 border border-white/10 rounded px-3 py-1 text-sm w-24" />
                            <label className="flex items-center gap-2 text-sm text-rose-400 font-bold">
                                <input type="checkbox" checked={isNeg} onChange={e => setIsNeg(e.target.checked)} />
                                Штраф (Минус-слово)
                            </label>
                        </div>
                        <button onClick={handleAddKw} className="w-full bg-primary text-black py-2 rounded font-bold hover:bg-white transition-colors uppercase text-xs flex justify-center items-center gap-2">
                            <Plus size={14}/> Добавить в словарь
                        </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {dictionaries.keywords.map(kw => (
                            <div key={kw.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                                <div>
                                    <div className="font-bold">{kw.keyword}</div>
                                    <div className={`text-xs ${kw.isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        Категория: {kw.category} | Вес: {kw.isNegative ? '-' : '+'}{kw.weight}
                                    </div>
                                </div>
                                <button onClick={async () => { await deleteKeyword(kw.id); load(); }} className="text-rose-500 hover:text-rose-400 p-2">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Provider Overrides */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold uppercase border-b border-white/10 pb-4">Правила Провайдеров (Overrides)</h2>

                    <div className="bg-white/5 p-6 rounded-xl space-y-4 border border-white/10">
                        <div className="text-xs text-slate-400 mb-2">Принудительно меняет категорию для услуг определенного провайдера, если в названии найдена строка (или для всей их категории).</div>
                        <div className="flex gap-2">
                            <input placeholder="Provider ID (UUID)" value={providerId} onChange={e => setProviderId(e.target.value)} className="bg-black/40 border border-white/10 rounded px-3 py-1 text-sm flex-1 outline-none font-mono text-[10px]" />
                            <input placeholder="Original Category ID" value={providerCat} onChange={e => setProviderCat(e.target.value)} className="bg-black/40 border border-white/10 rounded px-3 py-1 text-sm flex-1 outline-none font-mono text-[10px]" />
                        </div>
                        <div className="flex gap-2">
                            <input placeholder="Слово в названии (optional)" value={providerKw} onChange={e => setProviderKw(e.target.value)} className="bg-black/40 border border-white/10 rounded px-3 py-1 text-sm flex-1 outline-none opacity-80" />
                            <select value={providerTarget} onChange={e => setProviderTarget(e.target.value)} className="bg-black/40 border border-white/10 rounded px-3 py-1 text-sm outline-none">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <button onClick={handleAddRule} className="w-full bg-primary text-black py-2 rounded font-bold hover:bg-white transition-colors uppercase text-xs flex justify-center items-center gap-2">
                            <Plus size={14}/> Добавить жесткое правило
                        </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {dictionaries.providerRules.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                                <div>
                                    <div className="text-[10px] font-mono opacity-50">Provider: {rule.providerId}</div>
                                    <div className="text-sm font-bold">Cat: {rule.providerCategory} {rule.keyword && `+ "${rule.keyword}"`}</div>
                                    <div className="text-xs text-primary font-black uppercase mt-1">=&gt; {rule.targetCategory}</div>
                                </div>
                                <button onClick={async () => { await deleteProviderRule(rule.id); load(); }} className="text-rose-500 hover:text-rose-400 p-2">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); }
            `}</style>
        </div>
    );
}
