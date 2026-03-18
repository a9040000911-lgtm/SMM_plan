"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import { Mail, MessageCircle, HelpCircle, Loader2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function SupportPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/client/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const supportBot = config?.config?.supportBot || process.env.NEXT_PUBLIC_SUPPORT_BOT || 'smmplan_support_bot';
    const supportEmail = config?.config?.supportEmail || 'support@smmplan.ru';

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin opacity-20" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <div className="space-y-4 text-center">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter">Поддержка</h1>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                    Мы всегда на связи. Выберите удобный способ связи, и мы ответим в кратчайшие сроки (обычно 15-30 минут).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <a href={`https://t.me/${supportBot}`} target="_blank" className="block group">
                    <div className="bg-card border border-border p-8 rounded-[2.5rem] hover:scale-[1.02] transition-all shadow-xl hover:shadow-primary/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-colors" />
                        <div className="relative space-y-4">
                            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                                <MessageCircle size={24} />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Telegram Bot</h2>
                            <p className="text-xs text-muted-foreground font-medium">Мгновенные ответы и статус заказов через нашего бота.</p>
                            <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-blue-500 text-white px-4 py-2 rounded-lg mt-4">Написать</span>
                        </div>
                    </div>
                </a>

                <a href={`mailto:${supportEmail}`} className="block group">
                    <div className="bg-card border border-border p-8 rounded-[2.5rem] hover:scale-[1.02] transition-all shadow-xl hover:shadow-orange-500/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/20 transition-colors" />
                        <div className="relative space-y-4">
                            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center">
                                <Mail size={24} />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Email</h2>
                            <p className="text-xs text-muted-foreground font-medium">Для деловых предложений и сложных технических вопросов.</p>
                            <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white px-4 py-2 rounded-lg mt-4">Отправить письмо</span>
                        </div>
                    </div>
                </a>
            </div>

            <div className="bg-muted/30 border border-border p-8 rounded-[2.5rem] text-center space-y-6">
                <HelpCircle size={32} className="mx-auto text-muted-foreground opacity-50" />
                <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase">Частые вопросы</h3>
                    <p className="text-xs text-muted-foreground">Проверьте наш раздел FAQ перед обращением.</p>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                    Перейти к FAQ
                </button>
            </div>
        </div>
    );
}


