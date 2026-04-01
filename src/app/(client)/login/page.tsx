'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { getProjectAuthSettings } from '@/app/_actions/auth/getProjectAuthSettings';
import { SmmplanLogo } from '@/components/ui/SmmplanLogo';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 2FA state
    const [needs2FA, setNeeds2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState('');
    const [verifying2FA, setVerifying2FA] = useState(false);

    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const message = searchParams.get('message');

    const [botUsername, setBotUsername] = useState<string | null>(null);

    React.useEffect(() => {
        getProjectAuthSettings().then(settings => {
            if (settings?.botUsername) {
                setBotUsername(settings.botUsername);
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
                callbackUrl,
            });

            if (res?.error) {
                // Check if it's a 2FA-required response
                if (res.error === '2FA_REQUIRED') {
                    setNeeds2FA(true);
                } else {
                    setError('Неверный email или пароль');
                }
            } else {
                router.push(callbackUrl);
            }
        } catch {
            setError('Ошибка сети');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        if (twoFACode.length !== 6) return;

        setVerifying2FA(true);
        setError('');
        try {
            const res = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: twoFACode }),
            });
            const data = await res.json();

            if (data.verified) {
                // Re-login with verified flag
                const loginRes = await signIn('credentials', {
                    email,
                    password,
                    twoFactorVerified: 'true',
                    redirect: false,
                    callbackUrl,
                });
                if (loginRes?.error) {
                    setError('Ошибка входа после 2FA');
                } else {
                    router.push(callbackUrl);
                }
            } else {
                setError(data.error || 'Неверный код');
            }
        } catch {
            setError('Ошибка сети');
        } finally {
            setVerifying2FA(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >

                {message === 'registered' && !needs2FA && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 text-center"
                    >
                        Аккаунт создан! Теперь войдите.
                    </motion.div>
                )}

                {/* Header */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <SmmplanLogo 
                        className="mb-8"
                        iconSize={24}
                        textSize="text-2xl"
                        colorMode="blue"
                    />
                    <h1 className="text-4xl font-black text-[#171717] mb-2 leading-tight">Вход в кабинет</h1>
                    <p className="text-slate-500 font-medium">Рады видеть вас снова</p>
                </div>

                {/* Card */}
                <div className="rounded-[2.5rem] bg-white border border-slate-100 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -z-10" />

                    <AnimatePresence mode="wait">
                        {!needs2FA ? (
                            <motion.form
                                key="login"
                                initial={{ opacity: 0, x: 0 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                {botUsername && (
                                    <div className="space-y-6 mb-8">
                                        <TelegramLoginButton 
                                            botUsername={botUsername} 
                                            onSuccess={() => router.push(callbackUrl)}
                                        />
                                        <div className="relative flex items-center justify-center">
                                            <div className="absolute inset-0 flex items-center px-4">
                                                <div className="w-full border-t border-slate-100"></div>
                                            </div>
                                            <span className="relative px-4 bg-white text-[10px] font-black text-slate-300 uppercase tracking-widest">ИЛИ ПОЧТА</span>
                                        </div>
                                    </div>
                                )}

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
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-sm font-bold text-[#171717]">Пароль</label>
                                        <Link href="/forgot-password" className="text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors">
                                            Забыли пароль?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Ваш пароль"
                                            className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-[#171717] placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                                            autoComplete="current-password"
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

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Войти в кабинет <ArrowRight className="w-5 h-5" /></>
                                    )}
                                </button>
                            </motion.form>
                        ) : (
                            /* 2FA Code Form */
                            <motion.form
                                key="2fa"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerify2FA}
                                className="space-y-5"
                            >
                                <div className="flex items-center justify-center gap-2 text-blue-500 mb-2">
                                    <ShieldCheck className="w-5 h-5" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Защищенный вход</span>
                                </div>

                                <p className="text-sm text-slate-500 text-center font-medium">
                                    Код отправлен на <span className="text-blue-500 font-bold">{email}</span>
                                </p>

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    required
                                    value={twoFACode}
                                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-[#171717] placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all text-center text-2xl font-black tracking-[0.5em]"
                                    autoFocus
                                />

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-center"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={verifying2FA || twoFACode.length !== 6}
                                    className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
                                >
                                    {verifying2FA ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Подтвердить <ArrowRight className="w-4 h-4" /></>}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setNeeds2FA(false); setError(''); setTwoFACode(''); }}
                                    className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Назад к входу
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {!needs2FA && (
                        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                            <Link
                                href="/register"
                                className="text-sm font-bold text-slate-400 hover:text-blue-500 transition-colors"
                            >
                                Нет аккаунта? <span className="text-blue-500">Зарегистрироваться</span>
                            </Link>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs font-medium text-slate-400/60 mt-8 px-4">
                    Входя в систему, вы принимаете условия{' '}
                    <Link href="/docs/rules" className="text-blue-500/60 hover:text-blue-500 underline">Пользовательского соглашения</Link>
                    {' '}и даете согласие на обработку данных согласно{' '}
                    <Link href="/docs/policy" className="text-blue-500/60 hover:text-blue-500 underline">Политике конфиденциальности</Link>
                </p>
            </motion.div>
        </div>
    );
}


export const dynamic = 'force-dynamic';
export default function V2LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}


