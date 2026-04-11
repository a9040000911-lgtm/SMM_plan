"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderEdit, Search } from 'lucide-react';
import { toast } from 'sonner';

interface BulkCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    categories: any[];
    onApply: (categoryId: string) => Promise<void>;
}

export function BulkCategoryModal({ isOpen, onClose, selectedCount, categories, onApply }: BulkCategoryModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    const filteredCategories = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return categories.filter(c => 
            c.name.toLowerCase().includes(lowerSearch) || 
            c.platform.toLowerCase().includes(lowerSearch)
        ).sort((a, b) => a.platform.localeCompare(b.platform));
    }, [categories, searchTerm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryId) {
            toast.error('Выберите категорию');
            return;
        }

        setIsSubmitting(true);
        try {
            await onApply(selectedCategoryId);
            setSearchTerm('');
            setSelectedCategoryId('');
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
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                                    <FolderEdit size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">Перемещение ({selectedCount})</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Выберите новую категорию
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 bg-white shrink-0 border-b border-slate-50">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Найти по названию или платформе..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 custom-scrollbar">
                                {filteredCategories.length === 0 ? (
                                    <div className="text-center p-8 text-slate-400 text-sm font-bold">Ничего не найдено</div>
                                ) : (
                                    filteredCategories.map(c => (
                                        <div 
                                            key={c.id}
                                            onClick={() => setSelectedCategoryId(c.id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                                                selectedCategoryId === c.id 
                                                ? 'bg-blue-50 border-blue-500 shadow-md' 
                                                : 'bg-white border-slate-100 hover:border-blue-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${selectedCategoryId === c.id ? 'bg-blue-500' : 'bg-slate-200'}`} />
                                                <div>
                                                    <div className={`text-sm font-black uppercase tracking-tight ${selectedCategoryId === c.id ? 'text-blue-900' : 'text-slate-600'}`}>{c.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{c.platform}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedCategoryId}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest border border-slate-800 hover:bg-blue-600 transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Перемещение...' : `Переместить выбранные (${selectedCount})`}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
