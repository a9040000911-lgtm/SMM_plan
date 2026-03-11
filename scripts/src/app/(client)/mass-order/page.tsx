'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Layers, CreditCard } from 'lucide-react';
import { previewMassOrder, executeMassOrder } from '@/app/_actions/orders/massOrderAction';

export const dynamic = 'force-dynamic';

export default function MassOrderPage() {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePreview = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError(null);
        setPreview(null);

        try {
            const res = await previewMassOrder(text);
            if (res.success) {
                setPreview(res.data);
            } else {
                setError(res.error || 'Ошибка при проверке заказа');
            }
        } catch (e: any) {
            setError(e.message || 'Сбой на сервере');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecute = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await executeMassOrder(text);
            if (res.success && res.data) {
                // Success state - redirect or show modal
                alert(`Успешно! Создан пакет #${res.data.batchId} на сумму ${res.data.totalAmount} ₽`);
                setText('');
                setPreview(null);
            } else {
                setError(res.error || 'Ошибка при оформлении заказа');
            }
        } catch (e: any) {
            setError(e.message || 'Сбой на сервере');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12">
            <main className="max-w-4xl mx-auto px-6">

                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
                        <Layers className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                        Массовый заказ
                    </h1>
                    <p className="text-slate-500 font-medium max-w-lg">
                        Оформляйте десятки заказов в один клик. Идеальное решение для реселлеров и SMM-агентств.
                    </p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] mb-8">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Список заказов</label>
                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">ID_Услуги | Ссылка | Количество</span>
                        </div>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="74 | https://t.me/durov | 1000&#10;129 | https://instagram.com/zuck | 500"
                            className="w-full h-64 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-sm font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            onClick={handlePreview}
                            disabled={isLoading || !text.trim()}
                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-slate-800 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && !preview ? 'Проверка...' : 'Проверить и рассчитать'}
                        </button>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600">
                            <AlertTriangle className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </motion.div>
                    )}
                </div>

                <AnimatePresence>
                    {preview && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(37,99,235,0.05)] overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500" />
                                Заказы успешно распознаны
                            </h3>

                            <div className="overflow-x-auto mb-8">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-xs">
                                            <th className="pb-4">Услуга</th>
                                            <th className="pb-4">Ссылка</th>
                                            <th className="pb-4 text-right">Кол-во</th>
                                            <th className="pb-4 text-right">Цена</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {preview.entries.map((entry: any, i: number) => (
                                            <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                                <td className="py-4 font-medium text-slate-900 pr-4">{entry.serviceName}</td>
                                                <td className="py-4 text-slate-500 font-mono text-xs max-w-[200px] truncate">{entry.link}</td>
                                                <td className="py-4 text-right font-black tabular-nums">{entry.quantity}</td>
                                                <td className="py-4 text-right font-black text-indigo-600 tabular-nums">{entry.price} ₽</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 flex items-center justify-between">
                                <div>
                                    <span className="block text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Итого к оплате</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-indigo-900 tracking-tighter tabular-nums">{preview.totalAmount}</span>
                                        <span className="text-sm font-bold text-indigo-500">₽</span>
                                    </div>
                                    <p className="text-xs font-medium text-indigo-400 mt-2">
                                        У вас на балансе: {preview.balance} ₽
                                    </p>
                                </div>

                                <button
                                    onClick={handleExecute}
                                    disabled={isLoading || !preview.hasSufficientBalance}
                                    className="px-8 py-5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    <CreditCard size={20} />
                                    {preview.hasSufficientBalance ? 'Оплатить и запустить' : 'Недостаточно средств'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}
