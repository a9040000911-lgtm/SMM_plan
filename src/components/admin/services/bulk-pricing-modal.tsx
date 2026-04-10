"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, DollarSign, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/ui';

interface BulkPricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    onApply: (operation: { type: 'add' | 'multiply' | 'increase_percent'; value: number }) => Promise<void>;
}

export function BulkPricingModal({ isOpen, onClose, selectedCount, onApply }: BulkPricingModalProps) {
    const [operationType, setOperationType] = useState<'increase_percent' | 'add' | 'multiply'>('increase_percent');
    const [value, setValue] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            toast.error('Введите корректное значение больше 0');
            return;
        }

        setIsSubmitting(true);
        try {
            await onApply({ type: operationType, value: numValue });
            setValue('');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                                    <Calculator size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">Массовая смена цен</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Выбрано услуг: {selectedCount}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Операция</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOperationType('increase_percent')}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                                            operationType === 'increase_percent' ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-blue-200"
                                        )}
                                    >
                                        <Percent size={18} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Наценка %</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOperationType('multiply')}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                                            operationType === 'multiply' ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200"
                                        )}
                                    >
                                        <X size={18} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Умножить</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOperationType('add')}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                                            operationType === 'add' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:border-emerald-200"
                                        )}
                                    >
                                        <DollarSign size={18} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Прибавить</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {operationType === 'increase_percent' ? 'Процент наценки (например, 20 = +20%)' :
                                     operationType === 'multiply' ? 'Множитель (например, 1.5)' :
                                     'Сумма в рублях (например, 50 = +50₽)'}
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    min="0.01"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="Введите значение..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !value}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest border border-slate-800 hover:bg-blue-600 transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Применение...' : `Обновить цены (${selectedCount})`}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

