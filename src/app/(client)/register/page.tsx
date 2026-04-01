'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password }),
            });
            const data = await res.json();
            if (res.ok) {
                router.push('/login?message=registered');
            } else {
                setError(data.error || 'Ошибка при регистрации');
            }
        } catch {
            setError('Ошибка сети. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
            {/* Background elements (minimal, clean) */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50">
                <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Header (Marketing copy PAS approach - simple) */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-blue-600 text-xs font-black uppercase tracking-widest hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all mb-6">
                        <Sparkles size={14} /> Smmplan B2B
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Создайте аккаунт</h1>
                    <p className="text-slate-500 font-medium">Закрытый API и гарантия Retention для вашего бизнеса</p>
                </div>

                {/* Card */}
                <div className="rounded-[2.5rem] bg-white border border-slate-100 p-8 sm:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] group-hover:bg-blue-500/10 transition-colors duration-700 -z-10" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Имя пользователя / Бренд</label>
                            <div className="relative group/input">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Company Name"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agency@domain.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Безопасный Пароль</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Минимум 6 символов"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-[13px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 font-medium flex items-center gap-2"
                            >
                                <ShieldCheck size={16} /> {error}
                            </motion.div>
                        )}

                        <div className="flex items-start gap-4 px-1 py-2">
                            <input
                                type="checkbox"
                                id="register_consent"
                                required
                                className="mt-1 shrink-0 w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500/20 transition-colors cursor-pointer"
                            />
                            <label htmlFor="register_consent" className="text-[12px] text-slate-500 font-medium leading-relaxed select-none cursor-pointer">
                                Я принимаю <Link href="/docs/policy" target="_blank" className="text-blue-600 font-bold hover:underline">Политику конфиденциальности</Link>
                                {' '}и <Link href="/docs/rules" target="_blank" className="text-blue-600 font-bold hover:underline">пользовательское соглашение</Link>.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-[15px] uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Зарегистрироваться <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm font-bold text-slate-500">
                            Уже работаете с нами? {' '}
                            <Link
                                href="/login"
                                className="text-blue-600 hover:text-blue-800 transition-colors underline decoration-blue-600/30 underline-offset-4"
                            >
                                Войти
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-300 mt-8">
                    Security & SLA Guaranteed
                </p>
            </motion.div>
        </div>
    );
}
