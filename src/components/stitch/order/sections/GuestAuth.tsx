'use client';
/**
 * GuestAuth — Inline email + password/magic code auth for unauthenticated users
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Key, AlertCircle, UserCircle } from 'lucide-react';
import { cn } from '@/utils/ui';
import { useSession } from 'next-auth/react';

interface GuestAuthProps {
    email: string;
    onEmailChange: (email: string) => void;
    onEmailBlur: () => void;
    authMode: 'PASSWORD' | 'MAGIC' | null;
    password: string;
    onPasswordChange: (pw: string) => void;
    magicCode: string;
    onMagicCodeChange: (code: string) => void;
    onSendMagicCode: () => void;
    isSendingCode: boolean;
    error: string | null;
    onErrorClear: () => void;
}

export const GuestAuth: React.FC<GuestAuthProps> = ({
    email,
    onEmailChange,
    onEmailBlur,
    authMode,
    password,
    onPasswordChange,
    magicCode,
    onMagicCodeChange,
    onSendMagicCode,
    isSendingCode,
    error,
    onErrorClear,
}) => {
    const { data: session } = useSession();

    // Don't render for authenticated users
    if (session) return null;

    return (
        <div className="space-y-3">
            {/* Section Label */}
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                    <UserCircle size={13} className="text-slate-600" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Контакт</span>
            </div>

            {/* Email + Auth Card */}
            <div className={cn(
                "border-2 rounded-2xl transition-all overflow-hidden",
                authMode ? "border-blue-300 bg-blue-50/30" : "border-slate-200 bg-slate-50"
            )}>
                {/* Email Row */}
                <div className="flex items-center px-4 py-3.5 gap-3">
                    <Mail size={18} className={cn("shrink-0 transition-colors", authMode ? "text-blue-500" : "text-slate-400")} />
                    <div className="flex-1 flex flex-col">
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest mb-0.5 transition-colors",
                            authMode ? "text-blue-500" : "text-slate-400"
                        )}>
                            Email для чека
                        </span>
                        <input
                            type="email"
                            value={email}
                            onChange={e => { if (error) onErrorClear(); onEmailChange(e.target.value); }}
                            onBlur={onEmailBlur}
                            placeholder="mail@example.com"
                            autoComplete="email"
                            className="bg-transparent border-none outline-none text-slate-900 font-bold text-sm placeholder:text-slate-300"
                        />
                    </div>
                    {authMode && (
                        <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg uppercase tracking-wider border border-amber-200/50 shrink-0">
                            {authMode === 'PASSWORD' ? 'Пароль' : 'Код'}
                        </span>
                    )}
                </div>

                {/* Auth Fields (Accordion) */}
                <AnimatePresence>
                    {authMode && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-200/50 overflow-hidden"
                        >
                            <div className="px-4 py-3 flex items-center gap-3 bg-white/60">
                                <Key size={16} className="text-blue-600 shrink-0" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            {authMode === 'PASSWORD' ? 'Введите пароль' : 'Код из почты'}
                                        </span>
                                        {authMode === 'PASSWORD' && (
                                            <button
                                                type="button"
                                                onClick={onSendMagicCode}
                                                disabled={isSendingCode}
                                                className="text-[9px] font-bold text-blue-600 hover:text-blue-500 uppercase tracking-wider"
                                            >
                                                {isSendingCode ? 'Отправляем...' : 'Забыли пароль?'}
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type={authMode === 'PASSWORD' ? 'password' : 'text'}
                                        value={authMode === 'PASSWORD' ? password : magicCode}
                                        autoFocus
                                        onChange={e => {
                                            if (error) onErrorClear();
                                            if (authMode === 'PASSWORD') {
                                                onPasswordChange(e.target.value);
                                            } else {
                                                onMagicCodeChange(e.target.value);
                                            }
                                        }}
                                        placeholder={authMode === 'PASSWORD' ? '••••••••' : '123456'}
                                        className="bg-transparent border-none outline-none text-slate-900 font-bold text-sm w-full"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs font-medium text-red-700"
                    >
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
