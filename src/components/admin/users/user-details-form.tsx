'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Role } from '@/generated/client';
import { updateUserAction } from '@/app/admin/users/actions';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Copy, Check, Zap, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserDetailsFormProps {
    user: {
        id: string;
        username: string | null;
        email: string | null;
        role: Role;
        balance: string;
        referralEarnings: string;
        referralPercent: number;
        effectiveReferralPercent: number;
        isPermanentlyBanned: boolean;
        banExpiresAt: Date | null;
        moderationNote: string | null;
        isEarlyBird: boolean;
        earlyBirdRank: number | null;
        isGlobalAdmin: boolean;
    };
    currentGlobalAdmin?: boolean;
}

export function UserDetailsForm({ user, currentGlobalAdmin }: UserDetailsFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [isBanned, setIsBanned] = useState(user.isPermanentlyBanned || (user.banExpiresAt ? user.banExpiresAt > new Date() : false));
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);
    const [balanceAdjustment, setBalanceAdjustment] = useState('');
    const [isGlobalAdmin, setIsGlobalAdmin] = useState(user.isGlobalAdmin);

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
        toast.info('Пароль сгенерирован');
    };

    const copyToClipboard = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        setCopied(true);
        toast.success('Пароль скопирован');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);

        const formData = new FormData(e.currentTarget);
        const adj = parseFloat(balanceAdjustment.replace(',', '.')) || 0;
        const currentBalance = parseFloat(user.balance);

        const data = {
            username: formData.get('username') as string,
            email: formData.get('email') as string || null,
            password: password || undefined,
            role: formData.get('role') as Role,
            balance: currentBalance + adj,
            referralEarnings: parseFloat(formData.get('referralEarnings') as string),
            referralPercent: parseInt(formData.get('referralPercent') as string) || 0,
            isBanned: isBanned,
            moderationNote: formData.get('moderationNote') as string,
            isGlobalAdmin: isGlobalAdmin
        };

        try {
            await updateUserAction(user.id, data);
            toast.success('Данные пользователя обновлены');
            setBalanceAdjustment('');
            setPassword('');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка обновления');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                    {/* ID */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID</label>
                        <div className="col-span-2">
                            <input
                                type="text"
                                value={user.id}
                                disabled
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Ник пользователя</label>
                            {user.isEarlyBird && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-full w-fit">
                                    <Zap size={10} className="text-amber-500 fill-amber-500" />
                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Pioneer</span>
                                </div>
                            )}
                        </div>
                        <div className="col-span-2">
                            <input
                                type="text"
                                name="username"
                                defaultValue={user.username || ''}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email</label>
                        <div className="col-span-2">
                            <input
                                type="email"
                                name="email"
                                defaultValue={user.email || ''}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Пароль</label>
                        <div className="col-span-2 flex gap-2">
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Оставьте пустым, чтобы не менять"
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all border border-slate-200"
                                title="Сгенерировать пароль"
                            >
                                <RefreshCw size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={copyToClipboard}
                                disabled={!password}
                                className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all border border-slate-200 disabled:opacity-50"
                                title="Копировать в буфер"
                            >
                                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Роль</label>
                        <div className="col-span-2">
                            <select
                                name="role"
                                defaultValue={user.role}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                            >
                                <option value="USER">Клиент</option>
                                <option value="ADMIN">Админ</option>
                                <option value="SUPPORT">Поддержка</option>
                                <option value="SEO">SEO</option>
                                <option value="RESELLER">Реселлер</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-3 items-start gap-4">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-3">Описание</label>
                        <div className="col-span-2">
                            <textarea
                                name="moderationNote"
                                defaultValue={user.moderationNote || ''}
                                rows={3}
                                placeholder="Заметки о пользователе..."
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Balance */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Баланс</label>
                        <div className="col-span-2 flex items-center gap-3">
                            <div className="w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-700">
                                {user.balance} ₽
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <span className="text-xl font-bold text-slate-400">+</span>
                                <input
                                    type="text"
                                    placeholder="Сумма корректировки"
                                    value={balanceAdjustment}
                                    onChange={(e) => setBalanceAdjustment(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Partner Balance */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Партнерский баланс</label>
                        <div className="col-span-2 flex items-center gap-3">
                            <input
                                type="number"
                                step="0.01"
                                name="referralEarnings"
                                defaultValue={user.referralEarnings}
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                            />
                            <div className="w-12 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-700 text-center">
                                ₽
                            </div>
                        </div>
                    </div>

                    {/* Partner Percent */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Процент партнера</label>
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tight italic">
                                Текущий фактический: {user.effectiveReferralPercent}%
                            </span>
                            {user.isEarlyBird && (
                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tight">+ Pioneer Boost (20%)</span>
                            )}
                        </div>
                        <div className="col-span-2 space-y-2">
                            <input
                                key={`${user.id}-${user.referralPercent}`}
                                type="number"
                                name="referralPercent"
                                defaultValue={user.referralPercent}
                                placeholder="0 = По умолчанию"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                            />
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-emerald-600">
                                0 = Использовать системный стандарт (обычно 10% или 20% для Pioneer)
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Статус</label>
                        <div className="col-span-2 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsBanned(!isBanned)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isBanned ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBanned ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-tight ${isBanned ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {isBanned ? 'Забанен' : 'Активна'}
                            </span>
                        </div>
                    </div>

                    {/* Global Admin Toggle (Only for Super Admins) */}
                    {currentGlobalAdmin && (
                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Shield size={12} className="text-blue-500" />
                                Super Admin
                            </label>
                            <div className="col-span-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsGlobalAdmin(!isGlobalAdmin)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isGlobalAdmin ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isGlobalAdmin ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-tight ${isGlobalAdmin ? 'text-blue-600' : 'text-slate-500'}`}>
                                    {isGlobalAdmin ? 'Да (Полный доступ)' : 'Нет'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="pt-4 grid grid-cols-3 gap-4">
                        <div />
                        <div className="col-span-2">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-10 py-3 bg-[#3fcb7d] text-white rounded-lg text-[13px] font-bold shadow-lg shadow-emerald-900/10 hover:bg-emerald-600 transition-all flex items-center gap-2"
                            >
                                {isPending && <Loader2 size={16} className="animate-spin" />}
                                Сохранить настройки
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}


