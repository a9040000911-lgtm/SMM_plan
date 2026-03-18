'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';

import {
    Layers, Import, Zap, ShieldCheck,
    ArrowRight, Settings, Info,
    CheckCircle2, HeartPulse
} from 'lucide-react';
import { motion } from 'framer-motion';

const Section = ({ title, icon: Icon, children, color = "blue" }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
    >
        <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-600`}>
                <Icon size={28} />
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h2>
                <div className={`h-1 w-12 bg-${color}-500 rounded-full mt-1`} />
            </div>
        </div>
        <div className="space-y-4 text-slate-600 leading-relaxed">
            {children}
        </div>
    </motion.div>
);

const Feature = ({ title, description }: any) => (
    <div className="flex gap-3">
        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-1" />
        <div>
            <span className="font-bold text-slate-800 block mb-0.5">{title}</span>
            <span className="text-sm">{description}</span>
        </div>
    </div>
);


export default function ServicesGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header */}
                <header className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                    >
                        <Zap size={14} /> Инструкция по эксплуатации
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                        Управление Каталогом <span className="text-blue-600">3.0</span>
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                        Интеллектуальная система управления услугами, проектами и автоматизацией импорта.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Layer 1: Structure */}
                    <Section title="1. Новая Иерархия" icon={Layers} color="blue">
                        <p>Мы перешли на 3-уровневое управление для максимального контроля:</p>
                        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-500/30">1</div>
                                <span className="font-black text-slate-800">Платформа + Категория</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">(TG | Подписчики)</span>
                            </div>
                            <ArrowRight className="ml-3 text-slate-300" size={16} />
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-500/30">2</div>
                                <span className="font-black text-slate-800">Базовая Услуга</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">(Внутренний тариф)</span>
                            </div>
                            <ArrowRight className="ml-3 text-slate-300" size={16} />
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-500/30">3</div>
                                <span className="font-black text-slate-800">Маппинг на Провайдера</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">(Связь с API)</span>
                            </div>
                        </div>
                    </Section>

                    {/* Layer 2: Projects */}
                    <Section title="2. Мультипроектность" icon={Settings} color="amber">
                        <p>Вкладка <strong>Проекты</strong> позволяет управлять видимостью услуг на разных сайтах:</p>
                        <ul className="space-y-3">
                            <Feature title="Индивидуальные цены" description="Вы можете задать разную стоимость одной и той же услуги для каждого домена." />
                            <Feature title="Выборочная публикация" description="Отключайте целые категории на определенных сайтах в один клик." />
                            <Feature title="Быстрая синхронизация" description="Изменения в базовой услуге мгновенно применяются ко всем сайтам." />
                        </ul>
                    </Section>

                    {/* Layer 3: Smart Import */}
                    <Section title="3. Умный Импорт 2.0" icon={Import} color="indigo">
                        <p>Новый анализатор автоматически распознает типы услуг:</p>
                        <ul className="space-y-3">
                            <Feature title="Приоритет Подписчиков" description="Система больше не путает подписчиков с просмотрами или бустами." />
                            <Feature title="Распознавание Бустов" description="Отдельное выделение бустов каналов (уровни для сторис)." />
                            <Feature title="Авто-маппинг" description="Автоматическая привязка к существующим категориям на основе ключевых слов." />
                        </ul>
                    </Section>

                    {/* Layer 4: Health & Monitoring */}
                    <Section title="4. Контроль Качества" icon={HeartPulse} color="rose">
                        <p>Вкладка <strong>Здоровье</strong> мониторит состояние системы:</p>
                        <ul className="space-y-3">
                            <Feature title="Балансы Провайдеров" description="Уведомления при достижении критического остатка на счету." />
                            <Feature title="Среднее время (ETA)" description="Расчет реальной скорости выполнения заказов по каждому тарифу." />
                            <Feature title="Успешность (Success Rate)" description="Автоматическое скрытие услуг с высоким процентом отмен." />
                        </ul>
                    </Section>

                </div>

                {/* Redundancy Tip */}
                <Section title="Резервирование (Failover)" icon={ShieldCheck} color="emerald">
                    <p>К одной вашей услуге можно привязать <strong>несколько</strong> тарифов от разных провайдеров.</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                            <div className="text-xs font-black text-emerald-600 uppercase mb-1">Приоритет 1</div>
                            <div className="text-sm font-bold text-emerald-800">Самый дешевый поставщик</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <div className="text-xs font-black text-slate-400 uppercase mb-1">Приоритет 2+</div>
                            <div className="text-sm font-bold text-slate-500">Резервные поставщики</div>
                        </div>
                    </div>
                </Section>

                {/* Footer Tip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl"
                >
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Info size={40} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black mb-2 tracking-tight">Золотое правило наценки</h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                            Вкладка <strong>Наценка</strong> позволяет задать глобальные правила. Помните: для массовых услуг (просмотры/лайки) рекомендуется множитель от 5х, для качественных (подписчики с гарантией) — от 1.5х до 3х.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/admin/services'}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-colors flex shadow-xl shadow-blue-500/20"
                    >
                        К Каталогу <ArrowRight className="ml-2" size={16} />
                    </button>
                </motion.div>

            </div>
        </div>
    );
}


