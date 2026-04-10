'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, Crown, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { upgradeToPriorityPass } from './actions';
import { useRouter } from 'next/navigation';

interface Props {
    isLoggedIn: boolean;
    hasPass: boolean;
}

export function PriorityPassClient({ isLoggedIn, hasPass }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleUpgrade = async () => {
        if (!isLoggedIn) {
            router.push('/login?callbackUrl=/priority-pass');
            return;
        }

        setIsLoading(true);
        setErrorMsg('');
        
        try {
            const redirectUrl = `${window.location.origin}/dashboard`;
            const result = await upgradeToPriorityPass(redirectUrl);
            
            if (result.success && result.confirmationUrl) {
                window.location.href = result.confirmationUrl;
            } else {
                setErrorMsg(result.error || 'Ошибка. Попробуйте еще раз.');
                setIsLoading(false);
            }
        } catch (e: any) {
            setErrorMsg(e.message || 'Сетевая ошибка');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-yellow-500/30">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-24 pb-16 px-6 lg:pt-32 lg:pb-24">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/40 via-neutral-950 to-neutral-950"></div>
                
                <div className="relative max-w-5xl mx-auto text-center space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/30 font-medium text-sm"
                    >
                        <Crown className="w-4 h-4" />
                        Smmplan Priority Pass
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-500"
                    >
                        Оптовые цены. <br className="hidden lg:block"/> 
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
                            Максимальная маржа.
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg lg:text-xl text-neutral-400 leading-relaxed"
                    >
                        Получите доступ к закупочным ценам провайдеров, обход розничных наценок 
                        и приоритетную техническую поддержку. Всё за единую подписку.
                    </motion.p>
                </div>
            </div>

            {/* Features & Checkout */}
            <div className="max-w-7xl mx-auto px-6 pb-24 grid lg:grid-cols-2 gap-16 items-start relative z-10">
                {/* Left: Features */}
                <div className="space-y-10">
                    <div className="space-y-6">
                        <FeatureCard 
                            icon={<Zap className="w-6 h-6 text-yellow-500" />}
                            title="Гарантия низких цен (100% Safety Floor)"
                            desc="Мы полностью отключаем розничную наценку для вашего аккаунта. Вы оплачиваете услуги себестоимости провайдера + минимальная комиссия шлюзов."
                        />
                        <FeatureCard 
                            icon={<Shield className="w-6 h-6 text-yellow-500" />}
                            title="VIP Поддержка"
                            desc="Ваши тикеты получают максимальный приоритет в системе. Автоматический возврат средств без модерации."
                        />
                        <FeatureCard 
                            icon={<Lock className="w-6 h-6 text-yellow-500" />}
                            title="Ранний доступ"
                            desc="Тестируйте новые закрытые сервисы (Telegram Premium, нейро-услуги) до того, как они станут доступны обычным пользователям."
                        />
                    </div>
                </div>

                {/* Right: Pricing Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden ring-1 ring-white/20 shadow-2xl shadow-yellow-900/20"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-30 pointer-events-none">
                        <Crown className="w-32 h-32 text-yellow-500" />
                    </div>

                    <div className="space-y-6 relative">
                        <div>
                            <h3 className="text-2xl font-bold">Priority Pass</h3>
                            <p className="text-neutral-400 mt-2">Месячная подписка на оптовый клуб</p>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-extrabold tracking-tight">1 990</span>
                            <span className="text-xl text-neutral-400 font-medium">₽ / мес</span>
                        </div>

                        <ul className="space-y-3 pt-6 border-t border-white/10">
                            {[
                                'Оптовые цены (Safety Floor)',
                                'Ежемесячное авто-продление (MRR)',
                                'Без лимитов на сумму заказа',
                                'Отмена в один клик'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                    <span className="text-neutral-300">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="pt-6">
                            {hasPass ? (
                                <div className="w-full py-4 px-6 rounded-xl bg-neutral-800 text-center font-bold text-neutral-300 border border-neutral-700">
                                    Подписка уже активна
                                </div>
                            ) : (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={isLoading}
                                    className="w-full group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Оформить Priority Pass
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            )}
                            
                            {errorMsg && (
                                <p className="text-red-400 text-sm mt-4 text-center font-medium">
                                    {errorMsg}
                                </p>
                            )}

                            <p className="text-center text-xs text-neutral-500 mt-4 leading-relaxed">
                                Нажимая кнопку, вы соглашаетесь на ежемесячное списание средств.
                                Вы можете отменить автопродление в любой момент в настройках аккаунта.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-colors">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-yellow-500/10">
                {icon}
            </div>
            <div>
                <h4 className="text-xl font-semibold mb-2">{title}</h4>
                <p className="text-neutral-400 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
