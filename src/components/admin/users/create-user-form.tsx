'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useActionState } from 'react';
import { createUserAction } from '@/app/admin/users/actions'; // We will assume this path
import { User, Mail, Lock, Coins, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function CreateUserForm() {
    const [state, formAction, isPending] = useActionState(createUserAction, {});

    return (
        <form action={formAction} className="space-y-6 max-w-lg mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">

            {state.error && (
                <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-bold flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    {state.error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Имя пользователя / Логин</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            name="username"
                            type="text"
                            required
                            placeholder="username"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email (опционально)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            name="email"
                            type="email"
                            placeholder="user@example.com"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Пароль (временный)</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Пользователь сможет сменить его позже.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Роль</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                name="role"
                                defaultValue="USER"
                                className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                            >
                                <option value="USER">Пользователь</option>
                                <option value="ADMIN">Администратор</option>
                                <option value="SUPPORT">Поддержка</option>
                                <option value="SEO">SEO</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Начальный баланс</label>
                        <div className="relative">
                            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                name="balance"
                                type="number"
                                defaultValue="0"
                                step="0.01"
                                placeholder="0 ₽"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₽</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-4">
                <Link href="/admin/users" className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                    Отмена
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isPending ? <Loader2 size={20} className="animate-spin" /> : 'Создать пользователя'}
                </button>
            </div>
        </form>
    );
}


