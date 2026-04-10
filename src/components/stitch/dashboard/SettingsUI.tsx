"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import {
    Lock, Mail, Save, Loader2, CheckCircle2,
    ShieldCheck, ToggleLeft, ToggleRight, Send as SendIcon,
    Smartphone, Bell, User, Key, ExternalLink
} from 'lucide-react';
import { cn } from '@/utils/ui';

interface SettingsUIProps {
    userData: any;
}

export function SettingsUI({ userData: initialUserData }: SettingsUIProps) {
    const [userData, setUserData] = useState(initialUserData);
    const [email, setEmail] = useState(userData?.email || '');
    const [whatsapp, setWhatsapp] = useState(userData?.whatsapp || '');
    const [telegramContact, setTelegramContact] = useState(userData?.telegramContact || '');

    // Passwords
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // States
    const [savingContacts, setSavingContacts] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [toggling2FA, setToggling2FA] = useState(false);

    // Results
    const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const [contactsResult, setContactsResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const [passwordResult, setPasswordResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const refreshUser = async () => {
        const res = await fetch('/api/client/user');
        if (res.ok) {
            const data = await res.json();
            setUserData(data);
        }
    };

    const handleSaveEmail = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailResult({ ok: false, msg: 'Некорректный email' });
            return;
        }
        setSavingEmail(true); setEmailResult(null);
        try {
            const res = await fetch('/api/client/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setEmailResult({ ok: true, msg: 'Email привязан' });
                await refreshUser();
            } else setEmailResult({ ok: false, msg: data.error || 'Ошибка' });
        } catch { setEmailResult({ ok: false, msg: 'Сбой сети' }); }
        setSavingEmail(false);
    };

    const handleSaveContacts = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSavingContacts(true); setContactsResult(null);
        try {
            const res = await fetch('/api/client/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whatsapp, telegramContact })
            });
            if (res.ok) {
                setContactsResult({ ok: true, msg: 'Данные обновлены' });
                await refreshUser();
            } else setContactsResult({ ok: false, msg: 'Ошибка' });
        } catch { setContactsResult({ ok: false, msg: 'Сбой сети' }); }
        setSavingContacts(false);
    };

    const handleToggle2FA = async () => {
        setToggling2FA(true);
        try {
            const res = await fetch('/api/client/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ twoFactorEnabled: !userData?.twoFactorEnabled })
            });
            if (res.ok) await refreshUser();
        } catch { /* ignore */ }
        setToggling2FA(false);
    };

    const handleSavePassword = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newPassword || newPassword !== confirmPassword) {
            setPasswordResult({ ok: false, msg: 'Проверьте пароли' });
            return;
        }
        setSavingPassword(true); setPasswordResult(null);
        try {
            const res = await fetch('/api/client/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordResult({ ok: true, msg: 'Успешно' });
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                await refreshUser();
            } else setPasswordResult({ ok: false, msg: data.error || 'Ошибка' });
        } catch { setPasswordResult({ ok: false, msg: 'Сбой сети' }); }
        setSavingPassword(false);
    };

    const getTgLink = () => {
        if (!userData?.id || !userData?.botUsername) return '';
        const prefix = userData.id.split('-')[0];
        return `https://t.me/${userData.botUsername}?start=bind_${prefix}`;
    };

    return (
        <div className="max-w-6xl mx-auto px-6 space-y-12 pb-32 lg:pb-40 pt-10">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase italic pr-2">
                    Персональные <span className="text-blue-600">Настройки</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Управление безопасностью и личными данными</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left Column: Profile & Contacts */}
                <div className="space-y-8">

                    {/* Public Profile Section */}
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-8 lg:p-10 shadow-2xl shadow-blue-900/5 space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600">
                                <User size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Личный Профиль</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Основные контактные данные</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Электронная почта</label>
                                <form onSubmit={handleSaveEmail} className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="email"
                                            readOnly={!!userData?.email}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={cn(
                                                "w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold outline-none transition-all",
                                                userData?.email ? "text-slate-400 italic" : "text-slate-900 focus:bg-white focus:border-blue-500"
                                            )}
                                            placeholder="example@mail.ru"
                                        />
                                    </div>
                                    {!userData?.email && (
                                        <button
                                            type="submit"
                                            disabled={savingEmail}
                                            className="px-8 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            {savingEmail ? <Loader2 size={16} className="animate-spin" /> : 'Link'}
                                        </button>
                                    )}
                                </form>
                                {emailResult && <p className={cn("text-[9px] font-black uppercase ml-4", emailResult.ok ? "text-emerald-500" : "text-rose-500")}>{emailResult.msg}</p>}
                            </div>

                            <form onSubmit={handleSaveContacts} className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">WhatsApp</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="tel"
                                            value={whatsapp}
                                            onChange={(e) => setWhatsapp(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-200"
                                            placeholder="+7 (999) 000-00-00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Telegram</label>
                                    <div className="relative">
                                        <SendIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="text"
                                            value={telegramContact}
                                            onChange={(e) => setTelegramContact(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-200"
                                            placeholder="@username"
                                        />
                                    </div>
                                </div>
                                
                                <div className="col-span-1 sm:col-span-2 mt-2">
                                    <button
                                        type="submit"
                                        disabled={savingContacts}
                                        className="w-full py-5 rounded-2xl bg-slate-950 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                                    >
                                        {savingContacts ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Обновить данные
                                    </button>
                                </div>
                            </form>
                            {contactsResult && <div className={cn("p-4 rounded-xl text-[10px] font-black uppercase text-center border", contactsResult.ok ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>{contactsResult.msg}</div>}
                        </div>
                    </div>

                    {/* Telegram Sync Section */}
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-8 lg:p-10 shadow-2xl shadow-blue-900/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl group-hover:scale-150 transition-transform duration-1000" />

                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600">
                                <SendIcon size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Telegram Bot</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Синхронизация процессов</p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-6 relative z-10">
                            {userData?.tgId ? (
                                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-emerald-900 uppercase">Связь установлена</p>
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                                            <CheckCircle2 size={12} /> Уведомления поступают в чат
                                        </div>
                                    </div>
                                    <div className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Active</div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Подключите нашего официального бота для мгновенного получения статусов ваших заказов и эксклюзивных алертов.</p>
                                    <a
                                        href={getTgLink()}
                                        target="_blank"
                                        className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                                    >
                                        Запустить синхронизацию <ExternalLink size={16} />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Security */}
                <div className="space-y-8">

                    {/* Security Management */}
                    <div className="bg-slate-950 border border-white/5 rounded-[3rem] p-8 lg:p-10 shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px]" />

                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] border border-white/5 flex items-center justify-center text-blue-400">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Безопасность</h2>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mt-1">Дополнительные уровни защиты</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-white uppercase">2FA Аутентификация</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email-код при входе</p>
                                </div>
                                <button
                                    onClick={handleToggle2FA}
                                    disabled={toggling2FA}
                                    className={cn("transition-all duration-300", userData?.twoFactorEnabled ? "text-blue-500" : "text-white/10")}
                                >
                                    {toggling2FA ? <Loader2 size={36} className="animate-spin" /> : userData?.twoFactorEnabled ? <ToggleRight size={48} strokeWidth={1} /> : <ToggleLeft size={48} strokeWidth={1} />}
                                </button>
                            </div>

                            <div className="p-6 bg-white/5 border border-dashed border-white/10 rounded-[2rem] flex items-center gap-4">
                                <Bell className="text-slate-600 shrink-0" size={20} />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">Система будет требовать 6-значный код подтверждения при каждой попытке авторизации.</p>
                            </div>
                        </div>
                    </div>

                    {/* Password Management */}
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-8 lg:p-10 shadow-2xl shadow-blue-900/5 space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600">
                                <Key size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">{userData?.hasPassword ? 'Смена Пароля' : 'Новый Пароль'}</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Контроль доступа</p>
                            </div>
                        </div>

                        <form onSubmit={handleSavePassword} className="space-y-5">
                            {userData?.hasPassword && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Текущий пароль</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-200"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Новый пароль</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Повторите</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={savingPassword || !newPassword}
                                className="w-full h-16 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                {userData?.hasPassword ? 'Обновить пароль' : 'Установить пароль'}
                            </button>
                            {passwordResult && <div className={cn("p-4 rounded-xl text-[10px] font-black uppercase text-center border", passwordResult.ok ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>{passwordResult.msg}</div>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}


