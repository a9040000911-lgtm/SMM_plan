'use client';

import React from 'react';
import { 
    X, 
    MousePointer2, 
    Layout, 
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyDrawerProps {
    selectedKey: string | null;
    strings: Record<string, string>;
    onClose: () => void;
    onStringChange: (key: string, value: string) => void;
    findKeyConfig: (key: string) => any;
}

export function PropertyDrawer({
    selectedKey,
    strings,
    onClose,
    onStringChange,
    findKeyConfig
}: PropertyDrawerProps) {
    if (!selectedKey) return null;

    const selectedConfig = findKeyConfig(selectedKey);

    return (
        <div className={cn(
            "w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-all duration-500 z-40 transform translate-x-0 relative h-full",
            !selectedKey && "translate-x-full fixed right-0 w-0 opacity-0"
        )}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                        <MousePointer2 size={18} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Элемент</h4>
                        <p className="text-sm font-black text-slate-800 tracking-tight">{selectedConfig?.label || 'Настройка'}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                {selectedConfig?.type === 'block' ? (
                    <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-blue-600 border border-slate-100">
                            <Layout size={40} />
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase text-blue-500">Виджет</span>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedConfig.label}</h3>
                            <p className="text-xs text-slate-400">Настройки скоро будут доступны.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Контент строки</label>
                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                                    {selectedConfig?.group || 'General'}
                                </span>
                            </div>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] px-8 py-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-[12px] focus:ring-blue-600/5 focus:border-blue-600/20 transition-all shadow-inner leading-relaxed min-h-[200px]"
                                value={strings[selectedKey] || ''}
                                onChange={(e) => onStringChange(selectedKey, e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-4 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Sparkles size={16} />
                                <span className="text-[11px] font-black uppercase">AI Studio</span>
                            </div>
                            <p className="text-[12px] text-slate-300">Наш ИИ улучшит этот текст для вас.</p>
                            <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/5 rounded-xl text-[10px] font-black uppercase text-white transition-all">
                                Улучшить
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
