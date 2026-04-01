"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { Lock, Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function SettingsClient() {
    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20 pt-10">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <Link href="/profile" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Назад в кабинет
                </Link>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
            >
                <h1 className="text-5xl font-black uppercase tracking-tighter italic text-slate-900">Настройки</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Персонализация и безопасность вашего аккаунта</p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.03)] space-y-12"
            >
                {/* Password Change */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">Безопасность</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Обновление пароля доступа</p>
                        </div>
                    </div>

                    <form className="space-y-6 max-w-md">
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Текущий пароль</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500/50 focus:bg-white outline-none rounded-2xl px-6 py-4 text-sm transition-all focus:shadow-lg focus:shadow-blue-500/5"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Новый пароль</label>
                                <input
                                    type="password"
                                    placeholder="Не менее 8 символов"
                                    className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500/50 focus:bg-white outline-none rounded-2xl px-6 py-4 text-sm transition-all focus:shadow-lg focus:shadow-blue-500/5"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Повторите новый пароль</label>
                                <input
                                    type="password"
                                    placeholder="Проверка совпадения"
                                    className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500/50 focus:bg-white outline-none rounded-2xl px-6 py-4 text-sm transition-all focus:shadow-lg focus:shadow-blue-500/5"
                                />
                            </div>
                        </div>
                        <button className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:shadow-2xl transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                            Сохранить новый пароль
                        </button>
                    </form>
                </div>

                <div className="w-full h-px bg-slate-50" />

                {/* Notifications */}
                <div className="relative group/notif">
                    <div className="absolute inset-0 bg-slate-50/50 rounded-[2rem] -m-4 transition-opacity opacity-0 group-hover/notif:opacity-100 pointer-events-none" />
                    <div className="flex items-center justify-between relative">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
                                <Bell size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight opacity-40">Уведомления</h2>
                                    <span className="bg-amber-100 text-amber-600 text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest animate-pulse border border-amber-200">
                                        Скоро
                                    </span>
                                </div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Email и Telegram оповещения</p>
                            </div>
                        </div>
                        <div className="hidden md:block text-right">
                            <p className="text-[9px] font-bold text-slate-300 uppercase leading-tight italic">Функция находится <br /> в разработке</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
