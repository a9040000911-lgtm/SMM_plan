'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Play, Pause, Timer } from 'lucide-react';

export function LiveRefresh() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [intervalSec, setIntervalSec] = useState(60); // 1 минута по умолчанию
  const [timeLeft, setTimeLeft] = useState(60);

  const refreshData = useCallback(() => {
    router.refresh();
    setTimeLeft(intervalSec);
  }, [router, intervalSec]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      refreshData();
    }

    return () => clearTimeout(timer);
  }, [isActive, timeLeft, refreshData]);

  const toggleActive = () => {
    if (!isActive) setTimeLeft(intervalSec);
    setIsActive(!isActive);
  };

  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-100">
        <button 
            onClick={toggleActive}
            className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}
            title={isActive ? 'Пауза' : 'Запустить авто-обновление'}
        >
            {isActive ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
        </button>
        
        <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Live</span>
            <span className={`text-[10px] font-black ${isActive ? 'text-blue-600' : 'text-slate-300'}`}>
                {isActive ? `${timeLeft}s` : 'OFF'}
            </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Timer size={12} className="text-slate-300" />
        <select 
            value={intervalSec}
            onChange={(e) => {
                const val = parseInt(e.target.value);
                setIntervalSec(val);
                setTimeLeft(val);
            }}
            className="bg-transparent text-[10px] font-bold uppercase text-slate-500 outline-none cursor-pointer"
        >
            <option value="30">30 сек</option>
            <option value="60">1 мин</option>
            <option value="300">5 мин</option>
        </select>
      </div>

      <button 
        onClick={() => router.refresh()}
        className="ml-1 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        title="Обновить сейчас"
      >
        <RefreshCw size={14} className={isActive && timeLeft === 0 ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}


