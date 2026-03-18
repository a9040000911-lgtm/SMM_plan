"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from "@/utils/ui";
import { translateCategory } from '@/utils/translations';
import { CatalogService } from '@/types/catalog';

interface CategoryAccordionV1Props {
    category: string;
    services: CatalogService[];
    index: number;
}

export const CategoryAccordionV1: React.FC<CategoryAccordionV1Props> = ({ category, services, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="cyber-box overflow-hidden mb-4 border-white/10 bg-white/[0.02]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors group text-left"
            >
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black tracking-[0.3em] opacity-30 italic uppercase">ГРУППА_0{index + 1}</span>
                        <h3 className="text-xl font-black text-white uppercase italic group-hover:text-primary transition-colors">
                            {translateCategory(category)}
                        </h3>
                    </div>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-black italic">
                        {services.length} UNIT
                    </span>
                </div>
                <div className={cn(
                    "w-10 h-10 border rounded-lg flex items-center justify-center transition-all duration-500",
                    isOpen ? "border-primary bg-primary/20 text-white rotate-180" : "border-white/10 text-slate-500"
                )}>
                    <ChevronDown size={20} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="p-5 pt-0 grid grid-cols-1 gap-3">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/[0.08] transition-all group/item"
                                >
                                    <div className="flex flex-col gap-1 mb-3 md:mb-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-primary/60 uppercase tracking-tighter">ID: {service.id.split('_').pop()}</span>
                                            <h4 className="text-sm font-bold text-white group-hover/item:text-primary transition-colors">{service.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-4 opacity-40 text-[10px] font-medium uppercase tracking-widest">
                                            <span>Мин: {service.min || 0}</span>
                                            <span>Макс: {(service.max || 0) > 1000000 ? ((service.max || 0) / 1000000).toFixed(1) + 'M' : (service.max || 0).toLocaleString('ru-RU')}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Цена за 1000:</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-mono font-black text-white italic">{Number(service.price).toFixed(2)}</span>
                                                <span className="text-xs font-bold text-primary italic">₽</span>
                                            </div>
                                        </div>
                                        <a
                                            href={`/v2/dashboard/orders/new?serviceId=${service.id}`}
                                            className="w-10 h-10 rounded border border-white/10 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                                            title="Заказать"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


