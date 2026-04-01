"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUpRight, ArrowDownLeft, RotateCcw, Plus, Loader2, Wallet, AlertCircle, Search, TrendingUp,
    Receipt, DownloadCloud, ChevronLeft, ChevronRight,
    ArrowRight, Clock, ShieldCheck, Banknote
} from 'lucide-react';
import { cn } from '@/utils/ui';
import { formatAmount } from '@/utils/formatter';

interface Transaction {
    id: string;
    type: string;
    amount: any; // Decimal from prisma
    status: string;
    createdAt: Date;
    orderId?: number | null;
}

interface TransactionsUIProps {
    initialBalance: number;
    initialTransactions: Transaction[];
}

const typeConfig: Record<string, { label: string; icon: any; color: string; bg: string; sign: string }> = {
    DEPOSIT: { label: 'Пополнение', icon: ArrowDownLeft, color: 'text-emerald-500', bg: 'bg-emerald-50', sign: '+' },
    PAYMENT: { label: 'Списание', icon: ArrowUpRight, color: 'text-rose-500', bg: 'bg-rose-50', sign: '-' },
    ORDER_PAYMENT: { label: 'Оплата заказа', icon: ArrowUpRight, color: 'text-rose-500', bg: 'bg-rose-50', sign: '-' },
    REFUND: { label: 'Возврат', icon: RotateCcw, color: 'text-blue-500', bg: 'bg-blue-50', sign: '+' },
};

const statusColors: Record<string, string> = {
    COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
    ERROR: 'bg-rose-50 text-rose-600 border-rose-100',
};

export function TransactionsUI({ initialBalance, initialTransactions }: TransactionsUIProps) {
    const [showDeposit, setShowDeposit] = useState(false);
    const [amount, setAmount] = useState('500');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterStatus, _setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    // Reset pagination when filters change
    React.useEffect(() => { setCurrentPage(1); }, [filterType, filterStatus, searchQuery]);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);
        setSubmitting(true);

        try {
            const res = await fetch('/api/client/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            const data = await res.json();
            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Ошибка создания платежа');
            }
        } catch { setError('Ошибка сети'); }
        finally { setSubmitting(false); }
    };

    const stats = useMemo(() => {
        let deposited = 0; let spent = 0; let refunded = 0;
        initialTransactions.forEach(tx => {
            if (tx.status === 'COMPLETED') {
                const val = Number(tx.amount) || 0;
                if (tx.type === 'DEPOSIT') deposited += val;
                if (['PAYMENT', 'ORDER_PAYMENT'].includes(tx.type)) spent += val;
                if (tx.type === 'REFUND') refunded += val;
            }
        });
        return { deposited, spent, refunded };
    }, [initialTransactions]);

    const filtered = useMemo(() => {
        return initialTransactions.filter(tx => {
            if (filterType === 'DEPOSIT' && tx.type !== 'DEPOSIT') return false;
            if (filterType === 'SPEND' && !['PAYMENT', 'ORDER_PAYMENT'].includes(tx.type)) return false;
            if (filterType === 'REFUND' && tx.type !== 'REFUND') return false;
            if (filterStatus !== 'ALL' && tx.status !== filterStatus) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return tx.orderId?.toString().includes(q) || tx.id.toLowerCase().includes(q);
            }
            return true;
        });
    }, [initialTransactions, filterType, filterStatus, searchQuery]);

    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    const exportToCSV = () => {
        if (filtered.length === 0) return;
        let csv = "ID;Дата;Тип;Статус;Сумма;Заказ\n";
        filtered.forEach(tx => {
            csv += `"${tx.id}";"${new Date(tx.createdAt).toLocaleString()}";"${tx.type}";"${tx.status}";"${Number(tx.amount).toFixed(2)}";"${tx.orderId || ''}"\n`;
        });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report_${new Date().toLocaleDateString()}.csv`;
        a.click();
    };

    return (
        <div className="space-y-10 pb-40">
            {/* Header / Wallet Card Area */}
            <div className="flex flex-col lg:flex-row gap-8 lg:items-end justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2"
                >
                    <h1 className="text-5xl md:text-8xl font-black text-slate-950 tracking-tighter uppercase italic pr-2 overflow-visible leading-[0.85]">
                        Финансовый <span className="text-blue-600">Хаб</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Управление балансом и контроль расходов</p>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 lg:flex-none p-6 bg-slate-950 rounded-[2.5rem] border border-blue-500/10 shadow-2xl flex items-center gap-6 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl" />
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:rotate-6 transition-transform">
                            <Wallet className="text-blue-400 w-6 h-6" />
                        </div>
                        <div className="pr-4">
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">Доступно</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white tracking-tighter tabular-nums">{formatAmount(initialBalance)}</span>
                                <span className="text-xs font-black text-blue-500 uppercase italic pr-2">rub&nbsp;</span>
                            </div>
                        </div>
                    </motion.div>

                    <button
                        onClick={() => setShowDeposit(!showDeposit)}
                        className="w-full sm:w-auto h-24 px-10 rounded-[2.5rem] bg-blue-600 text-white font-black hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group"
                    >
                        <div className={cn("transition-transform duration-500", showDeposit && "rotate-45")}>
                            <Plus size={20} />
                        </div>
                        <span className="text-xs uppercase tracking-widest">{showDeposit ? "Отмена" : "Пополнить баланс"}</span>
                    </button>
                </div>
            </div>

            {/* Deposit Form */}
            <AnimatePresence>
                {showDeposit && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white border border-slate-100 rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-blue-900/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10 max-w-4xl mx-auto space-y-10">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Пополнение счета</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Обработка платежа через защищенный шлюз YooKassa </p>
                                </div>

                                <form onSubmit={handleDeposit} className="space-y-10">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                        <div className="lg:col-span-12">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-3">Выберите сумму или введите вручную</div>
                                            <div className="flex flex-wrap gap-4">
                                                {['500', '1000', '2500', '5000', '10000'].map(val => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => setAmount(val)}
                                                        className={cn(
                                                            "px-8 py-4 rounded-2xl text-xs font-black transition-all border-2",
                                                            amount === val ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200"
                                                        )}
                                                    >
                                                        {val} ₽
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-8 relative">
                                            <input
                                                type="number"
                                                min="10"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] py-8 px-10 text-4xl font-black text-slate-950 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-200"
                                                placeholder="100.00"
                                            />
                                            <span className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-200 font-black text-3xl italic uppercase">rub</span>
                                        </div>

                                        <div className="lg:col-span-4 flex items-center">
                                            <button
                                                disabled={submitting || !amount}
                                                className="w-full h-full py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                                            >
                                                {submitting ? <Loader2 className="animate-spin" /> : <>Перейти к оплате <ArrowRight size={16} /></>}
                                            </button>
                                        </div>
                                    </div>

                                    {error && <div className="p-6 bg-rose-50 text-rose-600 rounded-3xl text-xs font-black uppercase tracking-widest border border-rose-100 flex items-center gap-3"><AlertCircle size={18} /> {error}</div>}

                                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl">
                                            <ShieldCheck size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Безопасная сделка</span>
                                        </div>
                                        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Banknote size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">0% Комиссия сервиса</span>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatBox label="Всего пополнений" value={stats.deposited} icon={<TrendingUp />} color="emerald" delay={0.1} />
                <StatBox label="Всего списаний" value={stats.spent} icon={<Receipt />} color="rose" delay={0.2} />
                <StatBox label="Возвратов" value={stats.refunded} icon={<RotateCcw />} color="blue" delay={0.3} />
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-6 p-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm items-center">
                <div className="flex p-1.5 bg-slate-50 rounded-2xl w-full lg:w-auto">
                    {['ALL', 'DEPOSIT', 'SPEND', 'REFUND'].map(t => (
                        <button key={t} onClick={() => setFilterType(t)} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filterType === t ? "bg-slate-950 text-white shadow-xl" : "text-slate-400 hover:text-slate-600")}>
                            {t === 'ALL' ? 'Все' : t === 'DEPOSIT' ? 'Входящие' : t === 'SPEND' ? 'Исходящие' : 'Возврат'}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Поиск по ID транзакции или номеру заказа..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-transparent rounded-2xl py-4 pl-16 pr-6 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-100 transition-all"
                    />
                </div>

                <button
                    onClick={exportToCSV}
                    className="w-full lg:w-auto px-8 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                    <DownloadCloud size={16} /> Экспорт
                </button>
            </div>

            {/* Transaction List */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                    {paginated.length > 0 ? paginated.map((tx, idx) => (
                        <TxRow key={tx.id} tx={tx} idx={idx} />
                    )) : (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                            <Clock className="mx-auto text-slate-200 mb-4" size={40} />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Транзакций не найдено</p>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-950 disabled:opacity-20 transition-all"><ChevronLeft size={20} /></button>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Страница {currentPage} / {totalPages}</div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-950 disabled:opacity-20 transition-all"><ChevronRight size={20} /></button>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatBox({ label, value, icon, color, delay }: { label: string, value: number, icon: any, color: 'emerald' | 'rose' | 'blue', delay: number }) {
    const variants = {
        emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
        rose: "text-rose-500 bg-rose-50 border-rose-100",
        blue: "text-blue-500 bg-blue-50 border-blue-100"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center gap-6 group"
        >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", variants[color])}>
                {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
            </div>
            <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</span>
                <span className="text-2xl font-black text-slate-950 tracking-tight">{value.toLocaleString('ru-RU')} ₽</span>
            </div>
        </motion.div>
    );
}

function TxRow({ tx, idx }: { tx: Transaction, idx: number }) {
    const cfg = typeConfig[tx.type] || typeConfig.PAYMENT;
    const Icon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + (idx * 0.03) }}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all"
        >
            <div className="flex items-center gap-5">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:rotate-6", cfg.bg, cfg.color)}>
                    <Icon size={24} />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-[13px] font-black text-slate-950 uppercase tracking-tight">{cfg.label}</span>
                        {tx.orderId && <span className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200 uppercase tracking-widest">ID #{tx.orderId}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>{new Date(tx.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>{new Date(tx.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="font-mono text-[8px] opacity-60">ID:{tx.id.slice(0, 8)}</span>
                    </div>
                </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                <div className={cn("text-2xl font-black tracking-tighter tabular-nums", cfg.color)}>
                    {cfg.sign}{formatAmount(tx.amount)}
                    <span className="text-blue-500 italic pr-2">₽&nbsp;</span>
                </div>
                <div className={cn("px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border", statusColors[tx.status])}>
                    {tx.status === 'COMPLETED' ? 'Успешно' : tx.status === 'PENDING' ? 'Ожидание' : 'Ошибка'}
                </div>
            </div>
        </motion.div>
    );
}




