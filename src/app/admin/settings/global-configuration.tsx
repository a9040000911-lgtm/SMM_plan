'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useTransition } from 'react';
import {
    Settings as SettingsIcon,
    Globe,
    Bot,
    CreditCard,
    ShieldAlert,
    FileText,
    ArrowLeftRight,
    Save,
    Puzzle,
    CalendarClock,
    Sparkles,
    LineChart
} from 'lucide-react';
import Link from 'next/link';
import { updateSettingsAction } from './actions';
import { SettingsTabs } from './components';
import { TwoFactorModal } from '@/components/admin/core/two-factor-modal';


export function GlobalConfiguration({ project, settingsMap }: { project: any, settingsMap: any }) {
    const [isPending, startTransition] = useTransition();
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [formDataCache, setFormDataCache] = useState<FormData | null>(null);
    const [error, setError] = useState<string | null>(null);


    // Helpers to safely access JSON config
    const paymentConfig = (project.paymentSettings as any) || {};
    const botConfig = (project.config as any) || {};

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            try {
                const result = await updateSettingsAction(formData);
                if (result && result.requires2FA) {
                    setFormDataCache(formData);
                    setShow2FAModal(true);
                    return;
                }
                if (result && result.error) {
                    setError(result.error);
                    return;
                }
                // Success - revalidation happens on server, UI updates naturally
            } catch (e: any) {
                setError(e.message);
            }
        });
    };

    const handle2FASubmit = (code: string) => {
        if (!formDataCache) return;
        formDataCache.append('verificationCode', code);
        handleSubmit(formDataCache);
        setShow2FAModal(false);
        // Note: setShow2FAModal(false) hides modal immediately while transition starts.
        // If 2FA fails again (e.g. wrong code), handleSubmit will reopen modal because backend returns requires2FA again.
        // Or if backend returns error 'Invalid Code', we show error.
        // My backend logic returns requires2FA if not verified.
        // So checking code validity inside verifyCode returns false -> requires2FA.
        // Perfect loop.
    };

    return (
        <div className="space-y-8 max-w-5xl pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <SettingsIcon size={24} className="text-slate-600" />
                        </div>
                        Глобальные настройки
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Управление конфигурацией проекта <b>{project.name}</b>.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl">
                    Error: {error}
                </div>
            )}

            <form action={handleSubmit}>
                {/* Hidden field to identify project context in action */}
                <input type="hidden" name="projectId" value={project.id} />

                <SettingsTabs>
                    {/* TAB 1: GENERAL */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
                        <h3 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-400 mb-6">
                            <Globe size={16} /> Основные параметры
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Название проекта</label>
                                <input name="name" defaultValue={project.name} className="input-field" />
                            </div>
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Домен</label>
                                <input name="domain" defaultValue={project.domain} className="input-field font-mono" />
                            </div>
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Brand Color (HEX)</label>
                                <input name="brandColor" defaultValue={project.brandColor} type="color" className="w-full h-12 rounded-xl cursor-pointer" />
                            </div>
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">WebApp URL</label>
                                <input name="WEBAPP_URL" defaultValue={settingsMap['WEBAPP_URL'] || ''} className="input-field font-mono text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    {/* TAB 2: FINANCE */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
                        <h3 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-400 mb-6">
                            <CreditCard size={16} /> Платежные системы
                        </h3>

                        {/* Provider Selector */}
                        <div className="space-y-1">
                            <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Платежный провайдер</label>
                            <select
                                name="payment_provider"
                                defaultValue={paymentConfig.provider || 'YOOKASSA'}
                                className="input-field bg-white"
                            >
                                <option value="YOOKASSA">YooKassa</option>
                                <option value="ROBOKASSA">Robokassa</option>
                            </select>
                        </div>

                        {/* YooKassa Settings */}
                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-4">
                            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                                YooKassa Credentials
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block mb-2 text-[10px] font-black uppercase tracking-wider text-emerald-600/70">Shop ID</label>
                                    <input name="yookassa_shopId" defaultValue={paymentConfig.yookassa?.shopId || paymentConfig.shopId || ''} className="input-field bg-white" placeholder="xxxxxx" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block mb-2 text-[10px] font-black uppercase tracking-wider text-emerald-600/70">Secret Key</label>
                                    <input name="yookassa_secretKey" defaultValue={paymentConfig.yookassa?.secretKey || paymentConfig.secretKey || ''} type="password" className="input-field bg-white" placeholder="live_..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="block mb-2 text-[10px] font-black uppercase tracking-wider text-emerald-600/70">Test Shop ID</label>
                                    <input name="yookassa_testShopId" defaultValue={paymentConfig.yookassa?.testShopId || ''} className="input-field bg-white" placeholder="test_xxxxxx" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block mb-2 text-[10px] font-black uppercase tracking-wider text-emerald-600/70">Test Secret Key</label>
                                    <input name="yookassa_testSecretKey" defaultValue={paymentConfig.yookassa?.testSecretKey || ''} type="password" className="input-field bg-white" placeholder="test_..." />
                                </div>
                            </div>
                        </div>

                        {/* Robokassa Settings */}
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                            <h4 className="font-bold text-blue-800 flex items-center gap-2">
                                Robokassa Credentials
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block mb-2 text-[10px] font-black uppercase tracking-wider text-blue-600/70">Merchant Login</label>
                                    <input name="robokassa_merchantLogin" defaultValue={paymentConfig.robokassa?.merchantLogin || ''} className="input-field bg-white" placeholder="your_shop_name" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block mb-2 text-[10px] font-black uppercase tracking-wider text-blue-600/70">Password #1</label>
                                    <input name="robokassa_password1" defaultValue={paymentConfig.robokassa?.password1 || ''} type="password" className="input-field bg-white" placeholder="Для формирования подписи" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block mb-2 text-[10px] font-black uppercase tracking-wider text-blue-600/70">Password #2</label>
                                    <input name="robokassa_password2" defaultValue={paymentConfig.robokassa?.password2 || ''} type="password" className="input-field bg-white" placeholder="Для проверки результата" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block mb-2 text-[10px] font-black uppercase tracking-wider text-blue-600/70">Test Password #1</label>
                                    <input name="robokassa_testPassword1" defaultValue={paymentConfig.robokassa?.testPassword1 || ''} type="password" className="input-field bg-white" placeholder="Тестовый #1" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block mb-2 text-[10px] font-black uppercase tracking-wider text-blue-600/70">Test Password #2</label>
                                    <input name="robokassa_testPassword2" defaultValue={paymentConfig.robokassa?.testPassword2 || ''} type="password" className="input-field bg-white" placeholder="Тестовый #2" />
                                </div>
                            </div>
                            <div className="text-xs text-blue-600/60 bg-blue-50 p-3 rounded-xl">
                                <strong>Result URL:</strong> https://yourdomain.com/api/webhooks/robokassa
                            </div>
                        </div>

                        {/* Payment Mode */}
                        <div className="space-y-1">
                            <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Режим работы</label>
                            <select
                                name="payment_mode"
                                defaultValue={paymentConfig.mode || 'PRODUCTION'}
                                className="input-field bg-white"
                            >
                                <option value="PRODUCTION">Production (Реальные платежи)</option>
                                <option value="TEST">Test (Тестовые платежи)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Мин. пополнение (₽)</label>
                                <input name="MIN_DEPOSIT_AMOUNT" type="number" defaultValue={settingsMap['MIN_DEPOSIT_AMOUNT'] || '100'} className="input-field" />
                            </div>
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Реф. бонус (%)</label>
                                <input name="REFERRAL_PERCENT" type="number" defaultValue={settingsMap['REFERRAL_PERCENT'] || '10'} className="input-field" />
                            </div>
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldAlert size={12} /> Loss Prevention Floor (%)
                                </label>
                                <input name="MIN_MARGIN_PERCENT" type="number" defaultValue={settingsMap['MIN_MARGIN_PERCENT'] || '500'} className="input-field border-rose-100 focus:border-rose-500 text-rose-600" />
                                <p className="text-[10px] text-slate-400">
                                    Глобальная защита от убытков. Если наценка на услугу упадет ниже этого %, услуга автоматически отключится.
                                    (Это НЕ наценка на продажу, а аварийный стоп-кран).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* TAB 3: BOT */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
                        <h3 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-400 mb-6">
                            <Bot size={16} /> Конфигурация Бота (Уведомления)
                        </h3>
                        <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl mb-8">
                            <p className="text-[11px] text-sky-700 leading-relaxed font-medium">
                                <b>Зачем это нужно?</b> Бот используется для отправки уведомлений администраторам (о низком балансе, новых тикетах) и для привязки Telegram-аккаунтов пользователей.
                                Система может работать и без него, но вы лишитесь части функционала уведомлений.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Bot Token</label>
                                <input name="botToken" defaultValue={project.botToken || ''} type="password" className="input-field font-mono" />
                            </div>
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Bot Username</label>
                                <input name="botUsername" defaultValue={project.botUsername || ''} className="input-field" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Приветственное сообщение (HTML)</label>
                            <textarea
                                name="BOT_WELCOME_TEXT"
                                rows={8}
                                defaultValue={settingsMap['BOT_WELCOME_TEXT'] || ''}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-mono focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all min-h-[200px] resize-y"
                                placeholder="<b>Привет!</b> Это ваш личный кабинет..."
                            />
                            <p className="text-[10px] text-slate-400">Поддерживаются стандартные HTML-теги: &lt;b&gt;, &lt;i&gt;, &lt;a href="..."&gt;, &lt;code&gt;.</p>
                        </div>
                    </div>

                    {/* TAB 4: MODERATION */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
                        <h3 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-400 mb-6">
                            <ShieldAlert size={16} /> Безопасность
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Ворнов до бана</label>
                                <input name="MAX_WARNINGS" type="number" defaultValue={settingsMap['MAX_WARNINGS'] || '3'} className="input-field" />
                            </div>
                            <div className="space-y-1">
                                <label className="block mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">Длительность бана (часов)</label>
                                <input name="AUTO_BAN_HOURS" type="number" defaultValue={settingsMap['AUTO_BAN_HOURS'] || '24'} className="input-field" />
                            </div>
                        </div>
                    </div>

                    {/* TAB 5: MODULARITY (GROWTH) */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
                        <h3 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-400 mb-6">
                            <Puzzle size={16} /> Модули и Точки Роста
                        </h3>
                        <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl mb-8">
                            <p className="text-[11px] text-purple-700 leading-relaxed font-medium">
                                <b>Управление экосистемой:</b> Здесь вы можете включать и отключать сложные продвинутые функции SMMPlan для этого проекта. Если функция отключена, интерфейс пользователя автоматически упрощается.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {/* Feature: Scheduled Orders */}
                            <label className="relative flex flex-col gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-200 bg-white cursor-pointer transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/30 group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-has-[:checked]:bg-blue-100 flex flex-col items-center justify-center shrink-0 transition-colors">
                                        <CalendarClock className="text-slate-500 group-has-[:checked]:text-blue-600 transition-colors" size={20} />
                                    </div>
                                    <div className="pt-1">
                                        <input type="checkbox" name="module_scheduled_orders" defaultChecked={botConfig.modules?.scheduledOrders ?? true} className="peer sr-only" />
                                        <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-colors relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 mb-1 group-has-[:checked]:text-blue-900 transition-colors">Отложенные заказы</h4>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Возможность планировать прирост на неделю вперед.</p>
                                </div>
                            </label>

                            {/* Feature: Smart Hints */}
                            <label className="relative flex flex-col gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 bg-white cursor-pointer transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/30 group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-has-[:checked]:bg-emerald-100 flex flex-col items-center justify-center shrink-0 transition-colors">
                                        <Sparkles className="text-slate-500 group-has-[:checked]:text-emerald-600 transition-colors" size={20} />
                                    </div>
                                    <div className="pt-1">
                                        <input type="checkbox" name="module_smart_hints" defaultChecked={botConfig.modules?.smartHints ?? true} className="peer sr-only" />
                                        <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-600 transition-colors relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 mb-1 group-has-[:checked]:text-emerald-900 transition-colors">Умные ИИ-Подсказки</h4>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Динамическое обучение клиента безопасным лимитам.</p>
                                </div>
                            </label>

                            {/* Feature: Tracking Bots */}
                            <label className="relative flex flex-col gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-200 bg-white cursor-pointer transition-all has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50/30 group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-has-[:checked]:bg-purple-100 flex flex-col items-center justify-center shrink-0 transition-colors">
                                        <LineChart className="text-slate-500 group-has-[:checked]:text-purple-600 transition-colors" size={20} />
                                    </div>
                                    <div className="pt-1">
                                        <input type="checkbox" name="module_tracking_graphs" defaultChecked={botConfig.modules?.trackingGraphs ?? false} className="peer sr-only" />
                                        <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-purple-600 transition-colors relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 mb-1 group-has-[:checked]:text-purple-900 transition-colors">Трекинг и Аналитика</h4>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Внешние боты-трекеры строят графики выполнения Drip-Feed.</p>
                                </div>
                            </label>

                        </div>
                    </div>

                    {/* TAB 6: LEGAL */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-400">
                                <FileText size={16} /> Юридическая информация
                            </h3>
                            <Link
                                href="/admin/legal"
                                className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                                Управлять документами <ArrowLeftRight size={12} className="rotate-90" />
                            </Link>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic text-sm text-slate-500">
                            Вы можете добавить неограниченное количество юридических документов (Оферта, Правила и т.д.) на специальной странице. Документы будут автоматически доступны в Боте и на Сайте.
                        </div>
                    </div>
                </SettingsTabs>

                {/* SYSTEM STATUS FOOTER */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-slate-900/20 mt-8">
                    <div className="text-slate-400 text-sm">
                        Настройки применяются для проекта: <span className="text-white font-bold">{project.name}</span>
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="group relative flex items-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 overflow-hidden ml-auto disabled:opacity-50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Save size={20} className="relative z-10" />
                        <span className="relative z-10 uppercase tracking-widest text-xs">
                            {isPending ? 'Сохранение...' : 'Сохранить'}
                        </span>
                    </button>
                </div>
            </form>

            <TwoFactorModal
                isOpen={show2FAModal}
                onClose={() => setShow2FAModal(false)}
                onSubmit={handle2FASubmit}
                isPending={isPending}
            />
        </div>
    );
}
