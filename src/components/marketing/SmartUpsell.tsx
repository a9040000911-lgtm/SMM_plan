'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface SmartUpsellProps {
    originalServiceId: string;
}

export function SmartUpsell({ originalServiceId }: SmartUpsellProps) {
    const [upsellData, setUpsellData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!originalServiceId) return;
        fetch(`/api/client/marketing/upsell?originalServiceId=${originalServiceId}`)
            .then(res => res.json())
            .then(data => {
                if (data.upsell) setUpsellData(data.upsell);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [originalServiceId]);

    if (loading || !upsellData) return null;

    const { platformSlug, platformName, categoryName, categorySlug, service } = upsellData;
    const categoryNameLC = categoryName.toLowerCase();

    return (
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50/30 border border-blue-100 rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden group">
            {/* Aesthetic Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full group-hover:bg-blue-400/20 transition-all duration-700 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10 w-full">
                <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-slate-100 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-widest">
                        <Sparkles size={14} /> Умная рекомендация
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        Закрепите рост <br />метрик профиля
                    </h3>
                    <p className="text-[13px] font-medium text-slate-600 leading-relaxed max-w-md">
                        Алгоритмы {platformName} любят комплексную активность. Добавьте{' '}
                        <strong className="text-indigo-600">{categoryNameLC}</strong>{' '}
                        чтобы многократно усилить эффект от вашего текущего заказа и повысить ER (Engagement Rate).
                    </p>
                </div>

                <div className="w-full md:w-auto shrink-0 bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col items-center">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Рекомендуемый тариф</p>
                    <p className="text-[15px] font-bold text-slate-900 text-center max-w-[200px] truncate mb-3" title={service.name}>
                        {service.name}
                    </p>
                    
                    <div className="text-indigo-600 font-black text-2xl mb-6 flex items-baseline gap-1">
                        {Number(service.pricePer1000).toFixed(2)} ₽ 
                        <span className="text-[10px] text-slate-400 font-bold uppercase">/ {service.priceUnit} шт</span>
                    </div>

                    <Link 
                        href={`/catalog?platform=${platformSlug.toLowerCase()}&category=${encodeURIComponent(categorySlug || categoryName)}&serviceId=${service.id}`}
                        className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-slate-900 text-white py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/30 hover:shadow-slate-900/20"
                    >
                        Заказать дополнение <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
