'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import {
    Database,
    Loader2,
    CheckCircle2,
    RefreshCw,
    Search,
    ArrowUpRight
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import { Decimal } from 'decimal.js';
import { smartSearch } from '@/utils/smart-search';

export default function MarkupManagerPage() {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('');

    // Display controls
    const [priceUnit, setPriceUnit] = useState<'1' | '1000'>('1000');
    const [currency, setCurrency] = useState<'RUB' | 'USD'>('RUB');
    const [rates, setRates] = useState<Record<string, number>>({ RUB: 1, USD: 95 });

    // Load initial data
    useEffect(() => {
        fetchData();
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            const res = await fetch('/api/admin/finance/rates');
            if (res.ok) {
                const data = await res.json();
                setRates(data);
            }
        } catch (e) {
            console.error('Failed to fetch rates', e);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/services');
            if (res.ok) {
                const data = await res.json();
                setServices(data.map((s: any) => ({
                    ...s,
                    recommendation: s.recommendedPrice
                })));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (amount: number) => {
        let price = amount;
        if (currency === 'USD') price = price / (rates.USD || 95);
        if (priceUnit === '1') price = price / 1000;

        return (
            <span>
                {currency === 'USD' ? '$' : ''}
                {formatAmount(new Decimal(price))}
                {currency === 'RUB' ? '₽' : ''}
            </span>
        );
    };

    const handleApplyOne = async (serviceId: string, newPrice: number) => {
        setIsUpdating(true);
        try {
            const res = await fetch('/api/admin/services/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: serviceId,
                    data: { pricePer1000: newPrice }
                })
            });

            if (res.ok) {
                setServices(prev => prev.map(s => s.id === serviceId ? { ...s, pricePer1000: newPrice } : s));
            }
        } catch (_e) {
            alert('Ошибка при сохранении');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleApplyAll = async () => {
        const toUpdate = filtered
            .filter(s => s.recommendation && Math.abs(s.recommendation - Number(s.pricePer1000)) > 0.1)
            .map(s => ({ id: s.id, pricePer1000: s.recommendation }));

        if (toUpdate.length === 0) return;

        if (!confirm(`Подтвердить обновление цен для ${toUpdate.length} услуг?`)) return;

        setIsUpdating(true);
        try {
            const res = await fetch('/api/admin/services/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates: toUpdate })
            });

            if (res.ok) {
                setServices(prev => prev.map(s => {
                    const update = toUpdate.find(u => u.id === s.id);
                    return update ? { ...s, pricePer1000: update.pricePer1000 } : s;
                }));
                alert(`Успешно обновлено ${toUpdate.length} услуг`);
            } else {
                const err = await res.json();
                alert(`Ошибка: ${err.error}`);
            }
        } catch (e: any) {
            alert(`Ошибка сети: ${e.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const filtered = (Array.isArray(services) ? services : []).filter(s => {
        if (!s || !s.name || !s.platform) return false;

        const platformMatch = selectedPlatform === '' || s.platform === selectedPlatform;
        if (!platformMatch) return false;

        if (!searchQuery) return true;

        return smartSearch(searchQuery, `${s.name} ${s.platform} ${s.id}`);
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Анализ цен...</p>
        </div>
    );

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-3">
                        Инспектор <span className="text-blue-600">Умной Наценки</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Ассистент контроля маржинальности. Подтверждайте или меняйте цены точечно.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setPriceUnit('1000')}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${priceUnit === '1000' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            За 1000
                        </button>
                        <button
                            onClick={() => setPriceUnit('1')}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${priceUnit === '1' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            За 1 шт
                        </button>
                    </div>

                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setCurrency('RUB')}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${currency === 'RUB' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            RUB
                        </button>
                        <button
                            onClick={() => setCurrency('USD')}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${currency === 'USD' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            USD
                        </button>
                    </div>

                    <button
                        onClick={fetchData}
                        className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-500 shadow-sm"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск по названию услуги или платформе..."
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>
                <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">Все платформы</option>
                    {Array.from(new Set(services.map(s => s.platform))).map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white border-b border-white/5 text-[10px] uppercase tracking-widest font-black">
                            <th className="px-8 py-5">Услуга / Платформа</th>
                            <th className="px-8 py-5">Закупка (Cost)</th>
                            <th className="px-8 py-5">Продажа / ROI</th>
                            <th className="px-8 py-5">Рекомендация</th>
                            <th className="px-8 py-5 text-right">Действие</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(service => {
                            const cost = Number(service.lastProviderPrice) ||
                                Number(service.providerMappings?.[0]?.providerService?.rawPrice) || 0;
                            const price = Number(service.pricePer1000);
                            const roi = cost > 0 ? ((price - cost) / cost) * 100 : 100;
                            const isLowRoi = roi < 30;
                            const rec = service.recommendation;

                            return (
                                <tr key={service.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                                                {service.name}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400 tracking-tighter uppercase">
                                                    {service.platform}
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-300 italic">ID: {service.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="font-mono font-bold text-slate-400 text-xs">
                                            {formatPrice(cost)}
                                        </div>
                                        {cost === 0 && <span className="text-[10px] text-rose-400 font-bold uppercase">Нет данных</span>}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-mono font-black text-slate-700 text-base">{formatPrice(price)}</span>
                                            <span className={`text-[10px] font-black uppercase ${isLowRoi ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                ROI: {Math.round(roi)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        {rec && Math.abs(rec - price) > 0.1 ? (
                                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-black text-blue-600 text-lg">{formatPrice(rec)}</span>
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                                        ROI: {Math.round(((rec - cost) / cost) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black italic">
                                                    +{Math.round(((rec - price) / price) * 100)}%
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-slate-300">
                                                <CheckCircle2 size={14} className="text-emerald-400 shadow-sm" />
                                                <span className="text-[10px] font-black uppercase tracking-tight">Оптимально</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        {rec && Math.abs(rec - price) > 0.1 ? (
                                            <button
                                                onClick={() => handleApplyOne(service.id, rec)}
                                                disabled={isUpdating}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ml-auto"
                                            >
                                                Принять
                                                <ArrowUpRight size={14} />
                                            </button>
                                        ) : (
                                            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-400 cursor-default inline-block">
                                                В рынке
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="p-20 text-center">
                        <Database className="mx-auto text-slate-100 mb-4" size={64} />
                        <p className="text-slate-400 font-bold uppercase tracking-widest">Услуги не найдены</p>
                    </div>
                )}
            </div>

            <div className="fixed bottom-8 right-8 z-50">
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl text-white flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-500">Рекомендаций:</span>
                        <span className="text-lg font-black text-blue-400 tabular-nums">
                            {filtered.filter(s => s.recommendation && Math.abs(s.recommendation - Number(s.pricePer1000)) > 0.1).length}
                        </span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <button
                        className={`px-6 py-3 bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleApplyAll}
                        disabled={isUpdating}
                    >
                        {isUpdating ? <Loader2 className="animate-spin" size={16} /> : null}
                        Подтвердить все видимые
                    </button>
                </div>
            </div>
        </div>
    );
}
