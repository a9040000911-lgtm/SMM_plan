"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { Lock, Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Link href="/profile" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-black uppercase tracking-widest mb-4">
                <ArrowLeft size={14} /> Назад в кабинет
            </Link>

            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Настройки</h1>

            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                {/* Password Change */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black italic">Безопасность</h2>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Смена пароля</p>
                        </div>
                    </div>

                    <form className="space-y-4 max-w-sm ml-auto mr-auto md:ml-12 md:mr-0 md:max-w-md">
                        <div className="space-y-2">
                            <input
                                type="password"
                                placeholder="Текущий пароль"
                                className="w-full bg-muted/30 border border-border focus:border-primary/50 outline-none rounded-xl px-4 py-3 text-sm transition-all"
                            />
                            <input
                                type="password"
                                placeholder="Новый пароль"
                                className="w-full bg-muted/30 border border-border focus:border-primary/50 outline-none rounded-xl px-4 py-3 text-sm transition-all"
                            />
                            <input
                                type="password"
                                placeholder="Подтвердите пароль"
                                className="w-full bg-muted/30 border border-border focus:border-primary/50 outline-none rounded-xl px-4 py-3 text-sm transition-all"
                            />
                        </div>
                        <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-lg hover:bg-primary/90 transition-all">
                            Обновить пароль
                        </button>
                    </form>
                </div>

                <div className="w-full h-px bg-border/50" />

                {/* Notifications (Placeholder) */}
                <div className="opacity-50 pointer-events-none">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black italic">Уведомления</h2>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Email и Telegram</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
