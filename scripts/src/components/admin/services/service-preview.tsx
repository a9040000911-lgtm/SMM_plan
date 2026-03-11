/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';

interface ServicePreviewProps {
    name: string;
    description: string;
    pricePer1000: number;
    minQty: number;
    maxQty: number;
    platform?: string;
    category?: string;
    isCurated?: boolean;
}

export function ServicePreview({
    name,
    description,
    pricePer1000,
    minQty,
    maxQty,
    platform = 'PLATFORM',
    isCurated = false
}: ServicePreviewProps) {
    // Calculate price per item for display (same logic as client)
    const pricePerItem = (pricePer1000 / 1000) || 0;

    return (
        <div className="relative w-full max-w-sm mx-auto">
            {/* Dark background container simulating the client dark mode */}
            <div className="bg-[#0f172a] p-6 rounded-3xl overflow-hidden relative min-h-[400px] border border-slate-700 shadow-2xl">

                {/* Cyber box styling from client */}
                <div className="cyber-box flex flex-col p-6 bg-[#0a0c12]/60 text-left transition-all border-white/10 h-full relative overflow-hidden rounded-2xl relative z-10">

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap size={60} className="text-white" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <div className="text-[8px] font-black text-blue-500/60 uppercase tracking-[0.3em]">
                                    PREVIEW_NODE
                                </div>
                                <h4 className="font-black text-white uppercase italic text-lg tracking-tighter leading-none break-words pr-2">
                                    {name || 'SERVICE NAME'}
                                </h4>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xl font-black italic text-blue-500">
                                    {pricePerItem.toFixed(4)}₽
                                </div>
                                <div className="text-[8px] uppercase opacity-30 font-bold text-white">
                                    за 1 шт.
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-300 leading-relaxed mb-10 flex-1 break-words line-clamp-6">
                            {(description || "Описание услуги будет отображаться здесь...").replace(/###/g, '').replace(/\*\*/g, '').trim()}
                        </p>

                        {/* Footer Info */}
                        <div className="space-y-4">
                            {isCurated && (
                                <div className="flex items-center gap-2 text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">
                                    <CheckCircle2 size={12} /> RECOMMENDED_SOURCE
                                </div>
                            )}

                            {/* Limits */}
                            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/40">
                                <span>Мин: {minQty}</span>
                                <span>Лимит: {maxQty}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Badge Overlay (Admin Only Context) */}
                <div className="absolute bottom-2 right-6 text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                    {platform}
                </div>
            </div>

            {/* Reflection/Glow effect underneath */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-blue-500/20 blur-xl rounded-[100%] pointer-events-none" />
        </div>
    );
}
