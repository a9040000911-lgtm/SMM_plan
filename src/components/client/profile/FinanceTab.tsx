"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { DepositModal } from "./DepositModal";

interface FinanceTabProps {
    currentBalance: number;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({ currentBalance }) => {
    const [showDepositModal, setShowDepositModal] = useState(false);

    return (
        <>
            <div className="space-y-6">
                <div className="rounded-[3rem] bg-white border border-slate-100 p-12 flex flex-col items-center justify-center text-center space-y-8 shadow-[0_30px_60px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-[0.02] rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110" />

                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                        <Wallet size={36} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-[#171717] tracking-tight uppercase italic">Пополнение <span className="text-blue-600">баланса</span></h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Безопасные платежи через шлюз PrimePay v3.0</p>
                    </div>
                    <button
                        onClick={() => setShowDepositModal(true)}
                        className="bg-[#171717] hover:bg-black text-white px-12 py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-3 hover:-translate-y-1"
                    >
                        <Plus size={18} />
                        Внести депозит
                    </button>
                </div>

                <div className="rounded-[2.5rem] bg-white border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 border-b border-slate-50 pb-4">Лог транзакций</h3>
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">История операций будет доступна после первого пополнения</p>
                    </div>
                </div>
            </div>

            <DepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                currentBalance={currentBalance}
            />
        </>
    );
};


