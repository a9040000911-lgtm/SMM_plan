'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
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
            {/* Background blobs */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-blue-500 text-sm mb-6 font-bold hover:text-blue-600 transition-all">
                        <Sparkles className="w-4 h-4" /> Smmplan
                    </Link>
                    <h1 className="text-4xl font-black text-[#171717] mb-2">Создайте аккаунт</h1>
                    <p className="text-slate-500 font-medium">Начните продвижение за минуту</p>
                </div>

                {/* Card */}
                <div className="rounded-[2.5rem] bg-white border border-slate-100 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -z-10" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#171717] ml-1">Имя пользователя</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ваш ник"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-[#171717] placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#171717] ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-[#171717] placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#171717] ml-1">Пароль</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Минимум 6 символов"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-[#171717] placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        <div className="flex items-start gap-3 px-1">
                            <input
                                type="checkbox"
                                id="register_consent"
                                required
                                className="mt-1 shrink-0 w-4 h-4 rounded border-slate-200 text-blue-500 focus:ring-blue-500/20"
                            />
                            <label htmlFor="register_consent" className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                Я даю согласие на обработку моих персональных данных в соответствии с{' '}
                                <Link href="/docs/policy" target="_blank" className="text-blue-500 hover:underline">Политикой конфиденциальности</Link>
                                {' '}и принимаю условия{' '}
                                <Link href="/docs/rules" target="_blank" className="text-blue-500 hover:underline">Пользовательского соглашения</Link>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Зарегистрироваться <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                        <Link
                            href="/login"
                            className="text-sm font-bold text-slate-400 hover:text-blue-500 transition-colors"
                        >
                            Уже есть аккаунт? <span className="text-blue-500">Войти</span>
                        </Link>
                    </div>
                </div>

                <p className="text-center text-xs font-medium text-slate-300 mt-8">
                    Регистрируясь, вы принимаете условия использования
                </p>
            </motion.div>
        </div>
    );
}
