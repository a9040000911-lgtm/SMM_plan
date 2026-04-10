"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Crown, Calendar, CheckCircle2, CreditCard, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/ui';
import { toggleSubscriptionAutoRenew } from '@/app/(client)/dashboard/premium/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SubscriptionData {
    id: string;
    status: string;
    currentPeriodEnd: Date;
    autoRenew: boolean;
    paymentMethodId: string | null;
}

interface PremiumUIProps {
    subscription: SubscriptionData | null;
}

export function PremiumUI({ subscription }: PremiumUIProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleAutoRenew = async (action: 'cancel' | 'resume') => {
        if (action === 'cancel' && !window.confirm('Вы уверены, что хотите отменить автопродление? Ваша подписка будет действовать до конца оплаченного периода.')) {
            return;
        }

        setIsLoading(true);
        try {
            const res = await toggleSubscriptionAutoRenew(action);
            if (res.success) {
                toast.success(action === 'cancel' ? 'Автопродление отключено' : 'Автопродление возобновлено');
                router.refresh();
            } else {
                toast.error(res.error || 'Ошибка при изменении статуса');
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!subscription) {
        return (
            <div className="space-y-10 pb-32 lg:pb-40">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase italic pr-2">
                        Priority <span className="text-amber-500">Pass</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Закрытый клуб для профессионалов</p>
                </div>

                <div className="bg-slate-950 rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-2xl border border-amber-500/20">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,transparent_70%)] pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-8">
                        <div className="w-24 h-24 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-500/20 mb-4">
                            <Crown size={48} />
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">У вас нет активной подписки</h2>
                            <p className="text-slate-400 font-medium">Получите доступ к скрытым базам провайдеров, скидке -15% на все услуги и выделенной линии поддержки B2B.</p>
                        </div>

                        <Link href="/priority-pass">
                            <button className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-sm font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform flex items-center gap-3">
                                Подробнее о Priority Pass <ArrowRight size={18} />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isActive = subscription.status === 'ACTIVE' && new Date(subscription.currentPeriodEnd) > new Date();
    const formattedDate = format(new Date(subscription.currentPeriodEnd), 'd MMMM yyyy', { locale: ru });

    return (
        <div className="space-y-10 pb-32 lg:pb-40">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase italic pr-2">
                    Priority <span className="text-amber-500">Pass</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Управление вашей подпиской</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Status Card */}
                <div className="lg:col-span-8 bg-slate-950 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1)_0%,transparent_70%)] pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                                    <Crown size={32} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest mb-1">Ваш статус</div>
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Premium</h2>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-slate-400" size={20} />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Оплаченный период до</div>
                                        <div className="text-lg font-bold text-white tracking-tight">{formattedDate}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <CreditCard className="text-slate-400" size={20} />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Статус продления</div>
                                        <div className={cn("text-sm font-black uppercase tracking-widest flex items-center gap-2", subscription.autoRenew ? "text-emerald-500" : "text-amber-500")}>
                                            {subscription.autoRenew ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                            {subscription.autoRenew ? "Автопродление ВКЛ" : "Автопродление ВЫКЛ"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Box */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:w-72 shrink-0">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Опции биллинга</div>
                            
                            {subscription.autoRenew ? (
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => handleToggleAutoRenew('cancel')}
                                        disabled={isLoading}
                                        className="w-full py-4 px-4 bg-white/5 hover:bg-rose-500 hover:text-white border border-white/10 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? 'Загрузка...' : 'Отменить подписку'}
                                    </button>
                                    <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                                        После отмены подписка будет действовать до {formattedDate}, после чего статус Premium будет отключен.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => handleToggleAutoRenew('resume')}
                                        disabled={isLoading}
                                        className="w-full py-4 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-transparent text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? 'Загрузка...' : 'Возобновить продление'}
                                    </button>
                                    <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                                        Средства будут списаны с привязанной карты автоматически накануне даты окончания.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Features Highlights */}
                <div className="lg:col-span-4 bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-center">
                    <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tight mb-6">Ваши Premium Привилегии</h3>
                    <ul className="space-y-5">
                        {[
                            'Скидка -15% на весь каталог услуг',
                            'Доступ к скрытым провайдерам (Deep API)',
                            'Выделенная B2B-линия поддержки',
                            'Ранний доступ к новым функциям'
                        ].map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <div className="mt-1 shrink-0 text-amber-500"><CheckCircle2 size={16} fill="currentColor" className="text-amber-100"/></div>
                                <span className="text-sm font-bold text-slate-600 leading-tight">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

