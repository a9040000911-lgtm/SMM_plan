"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from "react";
import { X, Wallet, CreditCard, Zap } from "lucide-react";
import { cn } from "@/utils/ui";
import { motion, AnimatePresence } from "framer-motion";

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentBalance: number;
}

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, currentBalance }) => {
    const [amount, setAmount] = useState(500);
    const [customAmount, setCustomAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleQuickAmount = (value: number) => {
        setAmount(value);
        setCustomAmount("");
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomAmount(value);
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed > 0) {
            setAmount(parsed);
        }
    };

    const handleDeposit = async () => {
        if (amount < 10) {
            alert("Минимальная сумма пополнения: 10₽");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/tma/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount })
            });

            const data = await response.json();

            if (data.success && data.url) {
                // Redirect to payment page
                window.location.href = data.url;
            } else {
                alert(data.message || "Ошибка при создании платежа");
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Ошибка при создании платежа");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="cyber-box bg-[#0a0c12] border-primary/30 max-w-md w-full p-8 space-y-6 relative overflow-hidden"
                        >
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />

                            {/* Header */}
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                                        <Wallet size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight italic text-white">Пополнить баланс</h2>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Текущий: {currentBalance.toFixed(2)}₽</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Quick amounts */}
                            <div className="relative z-10 space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/70">Быстрый выбор</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {QUICK_AMOUNTS.map((value) => (
                                        <button
                                            key={value}
                                            onClick={() => handleQuickAmount(value)}
                                            className={cn(
                                                "p-4 rounded-xl border-2 font-black text-sm transition-all",
                                                amount === value && !customAmount
                                                    ? "border-primary bg-primary/20 text-primary"
                                                    : "border-white/10 bg-white/5 text-white hover:border-primary/50"
                                            )}
                                        >
                                            {value}₽
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom amount */}
                            <div className="relative z-10 space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/70">Своя сумма</label>
                                <input
                                    type="number"
                                    value={customAmount}
                                    onChange={handleCustomAmountChange}
                                    placeholder="Введите сумму"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:border-primary focus:bg-white/10 transition-all outline-none"
                                    min="10"
                                />
                                <p className="text-[10px] text-slate-500">Минимальная сумма: 10₽</p>
                            </div>

                            {/* Total */}
                            <div className="relative z-10 p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-primary/70">Сумма к оплате</span>
                                <span className="text-2xl font-black tracking-tight italic text-primary">{amount.toFixed(2)}₽</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="relative z-10 flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleDeposit}
                                    disabled={isLoading || amount < 10}
                                    className="flex-1 px-6 py-3 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Загрузка...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={16} />
                                            Оплатить
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Info Banner */}
                            <div className="relative z-10 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-2">
                                <Zap size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-blue-300">
                                    Средства поступают на баланс мгновенно после успешной оплаты.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


