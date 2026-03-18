"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { ShoppingCart, LayoutDashboard, Rocket } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function CartPage() {
    return (
        <div className="max-w-4xl mx-auto py-24 text-center space-y-8">
            <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mx-auto opacity-20">
                <ShoppingCart size={48} />
            </div>

            <div className="space-y-4">
                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Корзина пуста</div>
                <h1 className="text-4xl font-black tracking-tighter uppercase italic">Ваша очередь заказов пуста</h1>
                <p className="max-w-md mx-auto text-sm text-muted-foreground font-medium leading-relaxed">
                    Выберите необходимые услуги в каталоге или воспользуйтесь интеллектуальным анализатором для подбора оптимального трафика.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <Link
                    href="/"
                    className="w-full sm:w-auto bg-primary text-primary-foreground px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Rocket size={18} /> К услугам
                </Link>
                <Link
                    href="/orders"
                    className="w-full sm:w-auto bg-card border border-border px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
                >
                    <LayoutDashboard size={18} /> Мои заказы
                </Link>
            </div>
        </div>
    );
}


