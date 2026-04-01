'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ListIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface PollOptionConfigProps {
    value: number | null;
    onChange: (value: number | null) => void;
    activeBrandColor: string;
}

export const PollOptionConfig: React.FC<PollOptionConfigProps> = ({
    value,
    onChange,
    activeBrandColor,
}) => {
    const currentValue = value ?? 1;

    const handleDecrease = () => {
        onChange(Math.max(1, currentValue - 1));
    };

    const handleIncrease = () => {
        onChange(currentValue + 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            <div className="flex items-center gap-2">
                <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${activeBrandColor}15` }}
                >
                    <ListIcon size={13} style={{ color: activeBrandColor }} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Номер ответа в опросе</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-[160px] flex items-stretch bg-slate-100 border border-slate-200 rounded-2xl h-12 overflow-hidden shadow-sm shrink-0">
                    <button
                        onClick={handleDecrease}
                        className="w-10 flex items-center justify-center bg-white border-r border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <input
                            type="number"
                            min={1}
                            value={currentValue}
                            onChange={(e) => onChange(parseInt(e.target.value) || 1)}
                            className="bg-transparent border-none outline-none text-slate-900 text-center font-black text-lg w-full leading-none"
                        />
                    </div>
                    <button
                        onClick={handleIncrease}
                        className="w-10 flex items-center justify-center bg-white border-l border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
                
                <div className="text-[10px] leading-[1.3] text-slate-400 font-medium">
                    Укажите порядковый номер варианта ответа в опросе (например, 1 для первого).
                </div>
            </div>
        </motion.div>
    );
};
