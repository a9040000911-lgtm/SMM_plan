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

export const Footer = () => {
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
                            Платформа №1 для профессионального продвижения в социальных сетях. Быстро, качественно и безопасно.
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

                        {/* Payment Icons - Positioned to the right on desktop */}
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
                            {/* Visa - Fixed viewBox for better visual size */}
                            <div className="h-5 w-auto flex items-center grayscale hover:grayscale-0 transition-all duration-300">
                                <svg viewBox="0 0 780 500" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M40,0h700c22.092,0,40,17.909,40,40v420c0,22.092-17.908,40-40,40H40c-22.091,0-40-17.908-40-40V40 C0,17.909,17.909,0,40,0z" fill="#0E4595" />
                                    <path d="m293.2 348.73l33.361-195.76h53.36l-33.385 195.76h-53.336zm246.11-191.54c-10.57-3.966-27.137-8.222-47.822-8.222-52.725 0-89.865 26.55-90.18 64.603-0.299 28.13 26.514 43.822 46.752 53.186 20.771 9.595 27.752 15.714 27.654 24.283-0.131 13.121-16.586 19.116-31.922 19.116-21.357 0-32.703-2.967-50.227-10.276l-6.876-3.11-7.489 43.823c12.463 5.464 35.51 10.198 59.438 10.443 56.09 0 92.5-26.246 92.916-66.882 0.199-22.269-14.016-39.216-44.801-53.188-18.65-9.055-30.072-15.099-29.951-24.268 0-8.137 9.668-16.839 30.557-16.839 17.449-0.27 30.09 3.535 39.938 7.5l4.781 2.26 7.232-42.429m137.31-4.223h-41.232c-12.773 0-22.332 3.487-27.941 16.234l-79.244 179.4h56.031s9.16-24.123 11.232-29.418c6.125 0 60.555 0.084 68.338 0.084 1.596 6.853 6.49 29.334 6.49 29.334h49.514l-43.188-195.64zm-65.418 126.41c4.412-11.279 21.26-54.723 21.26-54.723-0.316 0.522 4.379-11.334 7.074-18.684l3.605 16.879s10.219 46.729 12.354 56.528h-44.293zm-363.3-126.41l-52.24 133.5-5.567-27.13c-9.725-31.273-40.025-65.155-73.898-82.118l47.766 171.2 56.456-0.064 84.004-195.39h-56.521" fill="#ffffff" />
                                    <path d="m146.92 152.96h-86.041l-0.681 4.073c66.938 16.204 111.23 55.363 129.62 102.41l-18.71-89.96c-3.23-12.395-12.597-16.094-24.186-16.527" fill="#F2AE14" />
                                </svg>
                            </div>

                            {/* Mastercard */}
                            <div className="h-6 w-auto flex items-center grayscale hover:grayscale-0 transition-all duration-300">
                                <svg viewBox="0 0 999.2 776" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                    <rect id="rect19" x="364" y="66.1" fill="#FF5A00" width="270.4" height="485.8" />
                                    <path fill="#EB001B" d="M382,309c0-98.7,46.4-186.3,117.6-242.9 C447.2,24.9,381.1,0,309,0C138.2,0,0,138.2,0,309s138.2,309,309,309c72.1,0,138.2-24.9,190.6-66.1C428.3,496.1,382,407.7,382,309z" />
                                    <path fill="#F79E1B" d="M999.2,309c0,170.8-138.2,309-309,309 c-72.1,0-138.2-24.9-190.6-66.1c72.1-56.7,117.6-144.2,117.6-242.9S570.8,122.7,499.6,66.1C551.9,24.9,618,0,690.1,0 C861,0,999.2,139.1,999.2,309z" />
                                </svg>
                            </div>

                            {/* Mir */}
                            <div className="h-5 w-auto flex items-center grayscale hover:grayscale-0 transition-all duration-300">
                                <svg viewBox="0 0 400 120" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                    <linearGradient id="mir-grad-v3" x1="370" x2="290" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#1F5CD7" />
                                        <stop stopColor="#02AEFF" offset="1" />
                                    </linearGradient>
                                    <path d="m31 13h33c3 0 12-1 16 13 3 9 7 23 13 44h2c6-22 11-37 13-44 4-14 14-13 18-13h31v96h-32v-57h-2l-17 57h-24l-17-57h-3v57h-31m139-96h32v57h3l21-47c4-9 13-10 13-10h30v96h-32v-57h-2l-21 47c-4 9-14 10-14 10h-30m142-29v29h-30v-50h98c-4 12-18 21-34 21" fill="#FFFFFF" />
                                    <path d="m382 53c4-18-8-40-34-40h-68c2 21 20 40 39 40" fill="url(#mir-grad-v3)" />
                                </svg>
                            </div>

                            {/* Crypto */}
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-800/50 rounded-lg px-3 py-1.5 hover:bg-slate-900 transition-colors">
                                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <Rocket size={10} className="text-amber-500" />
                                </div>
                                Crypto
                            </div>
                        </div>
                    </div>

                    {/* Legal Disclaimer */}
                    <p className="text-xs font-medium text-slate-500 leading-relaxed text-center md:text-left opacity-90">
                        *Компания Meta, которой принадлежат Instagram и Facebook, признана экстремистской организацией и запрещена на территории РФ
                    </p>
                </div>
            </div>
        </footer>
    );
};
