'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { MousePointerClick, Settings2, Rocket, BarChart3 } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: "Выберите услугу",
        description: "Выберите социальную сеть и тип продвижения в нашем каталоге.",
        icon: <MousePointerClick className="w-6 h-6 text-blue-400" />
    },
    {
        id: 2,
        title: "Настройте параметры",
        description: "Укажите ссылку и количество. Для Drip-Feed настройте интервалы.",
        icon: <Settings2 className="w-6 h-6 text-purple-400" />
    },
    {
        id: 3,
        title: "Запуск",
        description: "Система автоматически распределит заказ между исполнителями.",
        icon: <Rocket className="w-6 h-6 text-pink-400" />
    },
    {
        id: 4,
        title: "Результат",
        description: "Наблюдайте за ростом активности в реальном времени.",
        icon: <BarChart3 className="w-6 h-6 text-emerald-400" />
    }
];

export function HowItWorks() {
    return (
        <section className="py-24 px-4 w-full bg-gradient-to-b from-black to-neutral-900/50">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-white mb-4">Как это работает</h2>
                <p className="text-center text-gray-500 mb-16">Простой путь к популярности за 4 шага</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 -z-10" />

                    {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center relative group">
                            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center mb-6 shadow-2xl group-hover:-translate-y-2 transition-transform duration-300">
                                {step.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed max-w-[200px]">
                                {step.description}
                            </p>

                            {/* Mobile Connector */}
                            {idx < steps.length - 1 && (
                                <div className="md:hidden w-0.5 h-12 bg-white/10 my-4" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


