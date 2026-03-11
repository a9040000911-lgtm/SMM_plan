/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { PieChart } from 'lucide-react';
import { ReportGenerator } from '@/components/admin/analytics/report-generator';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3 italic">
            <PieChart className="text-blue-600" />
            БИЗНЕС-АНАЛИТИКА
          </h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Центр аналитики и экспорта данных</p>
        </div>
      </div>

      <div className="p-1 bg-slate-100 rounded-[2.5rem] border border-slate-200 shadow-inner">
        <div className="bg-white/50 backdrop-blur-sm rounded-[2.2rem] p-8 space-y-8">
          <div className="max-w-2xl">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              Инструкция по выгрузке
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
              Выберите необходимый период времени для финансовых отчетов и продаж. База клиентов выгружается полностью на текущий момент. Все отчеты формируются в формате CSV, совместимом с Excel и Google Sheets.
            </p>
          </div>

          <ReportGenerator />
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 opacity-20">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
          Надежное шифрование
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
          Обработка в реальном времени
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
          Экспорт по стандарту ISO
        </div>
      </div>
    </div>
  );
}
