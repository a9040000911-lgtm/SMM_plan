"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, ArrowRight, Package, Zap, Sparkles } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getStrategyServices } from '@/app/_actions/services/getStrategyServices';

export function CartContent() {
    const [cart, setCart] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [magicCode, setMagicCode] = useState('');
    const [authMode, setAuthMode] = useState<'PASSWORD' | 'MAGIC' | null>(null);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCart = () => {
            try {
                const stored = JSON.parse(localStorage.getItem('cart') || '[]');
                setCart(Array.isArray(stored) ? stored : []);
            } catch (e) {
                setCart([]);
            }
            setIsLoaded(true);
        };
        loadCart();
        window.addEventListener('cart-updated', loadCart);
        return () => window.removeEventListener('cart-updated', loadCart);
    }, []);

    const removeFromCart = (id: string) => {
        const newCart = cart.filter(item => item.id !== id);
        localStorage.setItem('cart', JSON.stringify(newCart));
        setCart(newCart);
        window.dispatchEvent(new Event('cart-updated'));
    };

    const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

    const handleCheckout = async () => {
        if (cart.length === 0 || isSubmitting) return;
        
        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Parallel Resolution of Strategy Services
            const strategyPromises = cart.map(item => 
                item.type === 'GROWTH_PACKAGE' 
                    ? getStrategyServices(item.platform, item.strategy) 
                    : Promise.resolve(null)
            );

            const strategyResults = await Promise.all(strategyPromises);
            const batchItems: any[] = [];

            cart.forEach((item, index) => {
                const strategyRes = strategyResults[index];
                
                if (item.type === 'GROWTH_PACKAGE' && strategyRes?.success && strategyRes.data) {
                    const { subServiceId, viewServiceId, reactionServiceId } = strategyRes.data;
                    
                    if ((item.subs || 0) > 0 && subServiceId) {
                        batchItems.push({ 
                            serviceId: subServiceId, 
                            link: item.link || 'https://t.me/smmplan_service', 
                            quantity: item.subs 
                        });
                    }
                    if ((item.views || 0) > 0 && viewServiceId) {
                        batchItems.push({ 
                            serviceId: viewServiceId, 
                            link: item.link || 'https://t.me/smmplan_service', 
                            quantity: item.views 
                        });
                    }
                    if ((item.reactions || 0) > 0 && reactionServiceId) {
                        batchItems.push({ 
                            serviceId: reactionServiceId, 
                            link: item.link || 'https://t.me/smmplan_service', 
                            quantity: item.reactions 
                        });
                    }
                } else if (item.type !== 'GROWTH_PACKAGE') {
                    batchItems.push({
                        serviceId: item.serviceId,
                        link: item.link,
                        quantity: item.totalQty || item.quantity
                    });
                }
            });

            if (batchItems.length === 0) {
                setError('Не удалось подобрать услуги для ваших стратегий. Пожалуйста, попробуйте позже.');
                setIsSubmitting(false);
                return;
            }

            // 2. Call Order API
            const res = await fetch('/api/client/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch: batchItems,
                    email: email || undefined,
                    password: authMode === 'PASSWORD' ? password : undefined,
                    magicCode: authMode === 'MAGIC' ? magicCode : undefined
                })
            });

            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    setAuthMode('PASSWORD');
                    setError(data.message || 'Этот email уже зарегистрирован. Пожалуйста, введите пароль или воспользуйтесь кодом из письма.');
                } else {
                    setError(data.error || 'Ошибка при оформлении заказа');
                }
            } else {
                // 3. SEAMLESS AUTH (Magic Token)
                if (data.loginToken) {
                    try {
                        const { signIn } = await import("next-auth/react");
                        await signIn('credentials', {
                            magicToken: data.loginToken,
                            redirect: false
                        });
                    } catch (authErr) {
                        console.warn('[Cart Seamless Auth] Failed:', authErr);
                    }
                }

                if (data.requiresPayment && data.paymentUrl) {
                    // 4. BROKEN LOOP PROTECTION: Save cart state before redirect
                    localStorage.setItem('smmplan_draft_cart', JSON.stringify({
                        items: cart,
                        email: email,
                        expiresAt: Date.now() + 1000 * 60 * 60 // 1 hour TTL
                    }));
                    
                    window.location.href = data.paymentUrl;
                } else if (data.success) {
                    // Success without payment (balance pay)
                    localStorage.removeItem('cart');
                    window.dispatchEvent(new Event('cart-updated'));
                    window.location.href = '/orders?payment=success';
                }
            }
        } catch (err) {
            setError('Ошибка соединения с сервером. Попробуйте обновить страницу.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendMagicCode = async () => {
        if (!email || isSendingCode) return;
        setIsSendingCode(true);
        setError(null);
        try {
            const res = await fetch('/api/client/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                setAuthMode('MAGIC');
                setError('Код отправлен на вашу почту!');
            } else {
                const data = await res.json();
                setError(data.error || 'Не удалось отправить код');
            }
        } catch (e) {
            setError('Ошибка сети при отправке кода');
        } finally {
            setIsSendingCode(false);
        }
    };

    if (!isLoaded) return null;

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Ваша <span className="text-blue-600 not-italic">Корзина</span>
                        </h1>
                        <p className="text-slate-500 font-medium font-inter">Проверьте выбранные стратегии перед оформлением.</p>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                        <ShoppingBag className="text-blue-600" size={28} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence mode="popLayout">
                            {cart.length > 0 ? (
                                cart.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-blue-200 transition-colors"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Package size={24} />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                    {item.platformLabel}
                                                    {item.quality === "HIGH" && <Sparkles size={8} className="text-amber-500 fill-amber-500" />}
                                                </span>

                                            </div>
                                            <h3 className="font-black text-slate-900 uppercase italic">{item.strategyLabel || 'СТРАТЕГИЯ 2026'}</h3>
                                            <p className="text-xs text-slate-500 font-medium tracking-tight">
                                                +{(item.subs || 0).toLocaleString()} подп. / +{(item.views || 0).toLocaleString()} просм.
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900">{item.price} ₽</p>
                                            <button 
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white p-12 rounded-[3rem] border-2 border-dashed border-slate-200 text-center"
                                >
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ShoppingBag size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-bold mb-6 italic">Ваша корзина пуста.</p>
                                    <Link href="/">
                                        <button className="px-8 py-3 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                                            Начать рост
                                        </button>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {cart.length > 0 && (
                        <div className="space-y-6">
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                                
                                <div className="relative z-10">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 italic">Сводка заказа</h3>
                                    
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Товары ({cart.length})</span>
                                            <span className="font-bold">{total} ₽</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Скидка</span>
                                            <span className="text-emerald-400 font-bold">0 ₽</span>
                                        </div>
                                        <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Итого:</span>
                                            <span className="text-3xl font-black italic">{total} ₽</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email для чека</label>
                                            <input 
                                                type="email"
                                                placeholder="example@mail.com"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (authMode) setAuthMode(null);
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
                                            />
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {authMode === 'PASSWORD' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-2 overflow-hidden"
                                                >
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-1">Введите пароль</label>
                                                    <input 
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full bg-white/10 border border-blue-500/30 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-600"
                                                    />
                                                    <div className="flex justify-between items-center px-1">
                                                        <button 
                                                            onClick={handleSendMagicCode}
                                                            className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
                                                        >
                                                            Забыли пароль? Войти по коду
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {authMode === 'MAGIC' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-2 overflow-hidden"
                                                >
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 ml-1">6-значный код из почты</label>
                                                    <input 
                                                        type="text"
                                                        placeholder="000 000"
                                                        maxLength={6}
                                                        value={magicCode}
                                                        onChange={(e) => setMagicCode(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-white/10 border border-emerald-500/30 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-emerald-500 transition-all text-white text-center tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-600"
                                                    />
                                                    <button 
                                                        onClick={() => setAuthMode('PASSWORD')}
                                                        className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors px-1"
                                                    >
                                                        Вернуться к паролю
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {error && (
                                            <motion.p 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-rose-500 text-[10px] font-black uppercase tracking-tight bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg"
                                            >
                                                {error}
                                            </motion.p>
                                        )}
                                    </div>

                                    <button 
                                        onClick={handleCheckout}
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-900/40 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Загрузка...' : 'Оформить'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-3xl flex items-start gap-4">
                                <div className="p-2 bg-blue-600 rounded-lg text-white">
                                    <Zap size={16} fill="currentColor" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">Smart Delivery</p>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Ваши заказы будут автоматически распределены для максимально естественного эффекта.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
