"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import Link from "next/link";
import { Rocket, Sparkles, Bug, Mail } from "lucide-react";
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
        <footer className="w-full bg-slate-950 text-white pt-20 pb-12 px-6 mt-auto shrink-0 z-10 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-8 mb-24">
                <div className="space-y-8 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Rocket className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white">
                            Smmplan
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
                        {t('footer.description', 'Профессиональная платформа для роста и доминирования в социальных медиа. С 2024 года.')}
                    </p>
                    {/* Proactive Mobile-Only Quick Actions (Moved from floating widgets) */}
                    <div className="md:hidden flex flex-col gap-4 mb-10 w-full px-4">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-bug-modal'))}
                            className="w-full py-5 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-3 transition-all hover:bg-orange-600"
                        >
                           <Bug size={16} /> Нашли баг? Сообщите нам
                        </button>
                        <div className="w-full h-px bg-slate-100/10 my-4" />
                    </div>

                    <div className="flex flex-col gap-4">
                        <Link href="https://t.me/smmplan" className="flex items-center gap-3 px-5 py-3 bg-slate-900 rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-black/20 group border border-slate-800/50 hover:border-blue-500/30">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <BrandIcon name="telegram" size={24} colorMode="original" className="group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Техподдержка 24/7</span>
                                <span className="text-[9px] font-bold text-slate-500 group-hover:text-blue-100 transition-colors">Написать в Telegram</span>
                            </div>
                        </Link>

                        <a href="mailto:support@smmplan.pro" className="flex items-center gap-3 px-5 py-3 bg-slate-900/40 rounded-2xl hover:bg-slate-800 transition-all group border border-slate-800/30 hover:border-slate-700/50">
                            <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                                <Mail size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Для предложений & PR</span>
                                <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-300 transition-colors">support@smmplan.pro</span>
                            </div>
                        </a>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Навигация</h4>
                    <div className="flex flex-col items-center md:items-start gap-4 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                        <Link href="/" className="hover:text-white transition-colors">Главная</Link>
                        <Link href="/catalog" className="hover:text-white transition-colors">Каталог</Link>
                        <Link href="/faq" className="hover:text-white transition-colors">Помощь (FAQ)</Link>
                        <Link href="/ai-manifest" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 underline decoration-blue-500/30 underline-offset-4">AI-Ready Manifest <Sparkles size={10} /></Link>
                        <Link href="/#reviews" className="hover:text-white transition-colors">Отзывы</Link>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Юридически</h4>
                    <div className="flex flex-col items-center md:items-start gap-4 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                        <Link href="/legal/terms" className="hover:text-white transition-colors">{t('footer.terms', 'Условия использования')}</Link>
                        <Link href="/legal/privacy" className="hover:text-white transition-colors">{t('footer.privacy', 'Приватность')}</Link>
                        <Link href="/legal/offer" className="hover:text-white transition-colors">Публичная оферта</Link>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/80">Безопасная оплата</h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-5 opacity-40 hover:opacity-100 transition-opacity duration-500">
                         <img src="/visa-svgrepo-com.svg" alt="Visa" className="h-5 w-auto grayscale invert" />
                         <img src="/Mastercard-logo.svg" alt="Mastercard" className="h-7 w-auto grayscale invert" />
                         <img src="/Mir-logo.SVG.svg" alt="Mir" className="h-4 w-auto grayscale invert" />
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
                             <Sparkles size={12} className="text-amber-500" />
                             <span className="text-[8px] font-black uppercase text-slate-400">Crypto</span>
                         </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-full border border-slate-800/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Secure Protocol v4.0</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-12 border-t border-slate-900 text-center space-y-4">
                <div className="text-[10px] text-slate-600 font-medium tracking-wide">
                    © 2024-{new Date().getFullYear()} Smmplan. Все права защищены. Эксклюзивная платформа профессионального уровня.
                </div>
                <p className="text-[10px] font-medium text-slate-700 leading-relaxed max-w-2xl mx-auto opacity-50">
                    {t('footer.legal_meta', '*Компания Meta, которой принадлежат Instagram и Facebook, признана экстремистской организацией и запрещена на территории РФ')}
                </p>
            </div>
        </footer>
    );
};


