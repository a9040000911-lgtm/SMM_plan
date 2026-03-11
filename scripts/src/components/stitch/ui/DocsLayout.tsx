'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Clock } from 'lucide-react';

interface DocsLayoutProps {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
}

export function DocsLayout({ title, lastUpdated, children }: DocsLayoutProps) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] selection:bg-blue-500/10 selection:text-blue-600">
            {/* Background Accents */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
                {/* Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                            <ChevronLeft size={16} />
                        </div>
                        На главную
                    </Link>
                </motion.div>

                {/* Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden"
                >
                    <div className="p-8 sm:p-16">
                        {/* Header */}
                        <div className="mb-12">
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    Документация
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Clock size={12} />
                                    {lastUpdated}
                                </div>
                                <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black border border-slate-200">
                                    18+
                                </div>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                                {title}
                            </h1>
                        </div>

                        {/* Document Content */}
                        <div className="prose prose-slate max-w-none 
                            prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-slate-900
                            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6 prose-p:font-medium
                            prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-ul:text-slate-600 prose-ul:font-medium
                            prose-li:mb-2
                            prose-strong:text-slate-900 prose-strong:font-extrabold
                        ">
                            {children}
                        </div>

                        {/* Footer Section */}
                        <div className="mt-20 pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Безопасность данных</p>
                                    <p className="text-xs text-slate-400 font-medium tracking-tight">Ваши данные защищены по стандарту 152-ФЗ</p>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-slate-300">
                                &copy; 2026 SMMplan. Все права защищены.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
