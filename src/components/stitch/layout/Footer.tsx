"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import Link from "next/link";
import { Rocket, Mail } from "lucide-react";
import { BrandIcon } from "../ui/BrandIcon";
import { useCmsBridge } from "@/components/cms/CmsBridge";

export const Footer = ({ cmsContent = {} }: { cmsContent?: Record<string, string> }) => {
    const { isLivePreview, liveStrings } = useCmsBridge();
    
    const t = (key: string, fallback: string) => {
        const fullKey = `cms.${key}`;
        const val = (isLivePreview && liveStrings[fullKey]) ? liveStrings[fullKey] : (cmsContent[fullKey] || fallback);
        
        if (isLivePreview) {
            return (
                <span 
                    data-cms-key={fullKey} 
                    className="outline-none focus:ring-2 focus:ring-blue-500/50 rounded-sm px-0.5 transition-all hover:bg-blue-50/50 cursor-pointer"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => {
                        if (window.parent !== window) {
                            window.parent.postMessage({
                                type: 'CMS_INLINE_CHANGE',
                                payload: { key: fullKey, value: e.currentTarget.innerText }
                            }, '*');
                        }
                    }}
                >
                    {val}
                </span>
            );
        }
        return val;
    };

    return (
        <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8 mt-auto shrink-0 z-10 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 group mb-6">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Rocket className="text-white w-6 h-6" />
                            </div>
                            <span className="text-xl font-black tracking-tighter text-white">
                                Smmplan
                            </span>
                        </Link>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-xs">
                            {t('footer.description', 'Платформа №1 для профессионального продвижения в социальных сетях. Быстро, качественно и безопасно.')}
                        </p>
                    </div>

                    {/* Links */}
                    <div className="col-span-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6">Навигация</h4>
                        <ul className="space-y-4">
                            <li><Link href="/catalog" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Каталог услуг</Link></li>
                            <li><Link href="/academy" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Академия SMM</Link></li>
                            <li><Link href="/glossary" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Словарь терминов</Link></li>
                            <li><Link href="/about" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">О компании</Link></li>
                            <li><Link href="/faq" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Помощь (FAQ)</Link></li>
                            <li><Link href="/dashboard/api" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">API разработчикам</Link></li>
                        </ul>
                    </div>

                    <div className="col-span-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6">Правовая информация</h4>
                        <ul className="space-y-4">
                            <li><Link href="/legal/terms" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Пользовательское соглашение</Link></li>
                            <li><Link href="/legal/privacy" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Политика конфиденциальности</Link></li>
                            <li><Link href="/legal/offer" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Публичная оферта</Link></li>
                        </ul>
                    </div>

                    {/* Contacts */}
                    <div className="col-span-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6">Контакты</h4>
                        <ul className="space-y-4">
                            <li>
                                <a href="https://t.me/smmplan_support" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">
                                    <BrandIcon name="telegram" size={16} />
                                    Telegram Поддержка
                                </a>
                            </li>
                            <li>
                                <a href="mailto:support@smmplan.ru" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">
                                    <Mail size={16} />
                                    support@smmplan.ru
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-900">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        {/* Copyright & Age restriction */}
                        <p className="text-xs font-bold text-slate-500 whitespace-nowrap">
                            &copy; {new Date().getFullYear()} Smmplan. Все права защищены. Возраст: 18+
                        </p>

                        {/* Payment Icons */}
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Secure Payments
                             </div>
                        </div>
                    </div>

                    <p className="text-xs font-medium text-slate-500 leading-relaxed text-center md:text-left opacity-90">
                        {t('footer.legal_meta', '*Компания Meta, которой принадлежат Instagram и Facebook, признана экстремистской организацией и запрещена на территории РФ')}
                    </p>
                </div>
            </div>
        </footer>
    );
};


