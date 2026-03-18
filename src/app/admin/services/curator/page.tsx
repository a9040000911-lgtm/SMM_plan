"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import {
    LayoutGrid,
    Eye,
    Save,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Search,
    ArrowLeft,
    Terminal,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/ui";
import { getServicesForCurator, updateService } from "../actions";
import { CategoryCard } from "@/components/client/CategoryCard";
import Link from "next/link";
import { getActivityLabel } from "@/utils/order-utils";

export default function CuratorPage() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [saveLoading, setSaveLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [priceUnit, setPriceUnit] = useState<'ITEM' | '1000'>('ITEM');

    // Filtered list
    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getActivityLabel(s.category).toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.platform.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await getServicesForCurator();
            setServices(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedService) return;
        setSaveLoading(true);
        setStatus(null);
        try {
            await updateService(selectedService.id, {
                name: selectedService.name,
                description: selectedService.description,
                requirements: selectedService.requirements,
                isCurated: selectedService.isCurated,
            });
            setStatus({ type: 'success', message: 'Система обновлена' });
            // Refresh local state
            setServices(prev => prev.map(s => s.id === selectedService.id ? selectedService : s));
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#02040a]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 animate-pulse">INIT_CURATOR_PROTOCOL...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#02040a] text-slate-300 font-mono overflow-hidden">
            {/* Sidebar: Service List */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-[#05070f]">
                <div className="p-6 border-b border-white/5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Link href="/admin/services">
                            <ArrowLeft size={16} className="text-primary hover:scale-110 transition-transform cursor-pointer" />
                        </Link>
                        <h1 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                            <Terminal size={14} className="text-primary" /> SERVICE_CURATOR
                        </h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                        <input
                            placeholder="SEARCH_NODE..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-[9px] uppercase outline-none focus:border-primary/50 text-white font-bold"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setPriceUnit('1000')}
                            className={cn(
                                "flex-1 px-2 py-1.5 rounded text-[8px] font-black uppercase tracking-widest transition-all",
                                priceUnit === '1000' ? "bg-primary text-black shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            За 1000
                        </button>
                        <button
                            onClick={() => setPriceUnit('ITEM')}
                            className={cn(
                                "flex-1 px-2 py-1.5 rounded text-[8px] font-black uppercase tracking-widest transition-all",
                                priceUnit === 'ITEM' ? "bg-primary text-black shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            За 1 шт
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {filteredServices.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedService({ ...s })}
                            className={cn(
                                "w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden",
                                selectedService?.id === s.id
                                    ? "bg-primary/10 border-primary/30 text-white shadow-[0_0_15px_-5px_rgba(var(--primary-rgb),0.3)]"
                                    : "bg-white/5 border-transparent hover:border-white/10"
                            )}
                        >
                            <div className="flex flex-col gap-1 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[7px] font-black opacity-30 tracking-widest leading-none uppercase">{s.platform}</span>
                                    {s.isCurated && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />}
                                </div>
                                <div className="text-[10px] font-bold truncate uppercase tracking-tight">{s.name}</div>
                                <div className="flex justify-between items-center">
                                    <div className="text-[7px] opacity-40 uppercase font-black">{getActivityLabel(s.category)}</div>
                                    <div className="text-[7px] font-black text-primary/60">
                                        {priceUnit === 'ITEM'
                                            ? (Number(s.pricePer1000) / 1000).toFixed(4)
                                            : Number(s.pricePer1000).toFixed(2)}₽
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Editor & Preview */}
            <div className="flex-1 flex overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {selectedService ? (
                        <motion.div
                            key={selectedService.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex overflow-hidden"
                        >
                            {/* Editor Section */}
                            <div className="flex-[1.2] p-10 overflow-y-auto border-r border-white/5 space-y-10 custom-scrollbar">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Zap size={14} /> SERVICE_PARAMETERS
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Корректировка услуги</h2>
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Публичное название</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-primary/50 uppercase tracking-tighter"
                                            value={selectedService.name}
                                            onChange={e => setSelectedService({ ...selectedService, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Маркетинговое описание</label>
                                        <textarea
                                            rows={4}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm font-medium text-white outline-none focus:border-primary/50 resize-none opacity-80 leading-relaxed"
                                            value={selectedService.description}
                                            onChange={e => setSelectedService({ ...selectedService, description: e.target.value })}
                                            placeholder="Опишите преимущества, качество и скорость..."
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                                            <AlertTriangle size={12} /> Обязательные требования
                                        </label>
                                        <textarea
                                            rows={3}
                                            className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl py-4 px-6 text-sm font-bold text-rose-200 outline-none focus:border-rose-500/50 resize-none uppercase italic tracking-tight"
                                            value={selectedService.requirements || ""}
                                            onChange={e => setSelectedService({ ...selectedService, requirements: e.target.value })}
                                            placeholder="ПРОФИЛЬ ДОЛЖЕН БЫТЬ ОТКРЫТ! НЕ МЕНЯТЬ НИКНЕЙМ ВО ВРЕМЯ ЗАКАЗА!"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl group hover:border-primary/20 transition-colors">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-white uppercase tracking-widest">Видимость на витрине</div>
                                            <div className="text-[8px] opacity-40 uppercase tracking-widest font-bold">Услуга будет отображаться в списке лучших</div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedService({ ...selectedService, isCurated: !selectedService.isCurated })}
                                            className={cn(
                                                "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                                                selectedService.isCurated ? "bg-primary" : "bg-white/10"
                                            )}
                                        >
                                            <motion.div
                                                animate={{ x: selectedService.isCurated ? 24 : 0 }}
                                                className="w-4 h-4 rounded-full bg-white shadow-lg"
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={saveLoading}
                                        className="cyber-box bg-primary text-black flex items-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {saveLoading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> SAVE_CHANGES</>}
                                    </button>
                                    {status && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={cn(
                                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                                status.type === 'success' ? "text-emerald-500" : "text-rose-500"
                                            )}
                                        >
                                            {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                            {status.message}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Link to Mappings */}
                                <div className="pt-10 border-t border-white/5">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">MAPPED_INFRASTRUCTURE</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedService.providerMappings?.map((m: any) => (
                                            <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold uppercase">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-white">{m.provider.name}</span>
                                                    <span className="opacity-40">#{m.providerServiceId}</span>
                                                </div>
                                                <div className="text-primary">{m.providerService.rawPrice}₽</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Section */}
                            <div className="flex-1 bg-black/40 p-10 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Eye size={14} /> DISPLAY_SIMULATION
                                    </div>
                                    <h2 className="text-sm font-black text-white uppercase italic">ПРЕВЬЮ НА ВИТРИНЕ</h2>
                                </div>

                                <div className="space-y-12">
                                    {/* Card Preview */}
                                    <div className="space-y-6">
                                        <div className="text-[8px] font-black uppercase opacity-20 tracking-widest italic border-b border-white/10 pb-2">Модуль категории [Bento]</div>
                                        <div className="max-w-[320px] pointer-events-none">
                                            <CategoryCard
                                                category={getActivityLabel(selectedService.category)}
                                                minPrice={Number(selectedService.pricePer1000)}
                                                platform={selectedService.platform}
                                                index={0}
                                                onClick={() => { }}
                                            />
                                        </div>
                                    </div>

                                    {/* List Item Preview */}
                                    <div className="space-y-6">
                                        <div className="text-[8px] font-black uppercase opacity-20 tracking-widest italic border-b border-white/10 pb-2">Список тарифов [Selection]</div>
                                        <div className="cyber-box flex flex-col p-6 bg-[#0a0c12]/40 text-left transition-all border-primary/20 max-w-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-black text-white uppercase italic text-sm text-primary">{selectedService.name}</h4>
                                                <div className="text-right">
                                                    <div className="text-xs font-black italic text-primary">
                                                        {priceUnit === 'ITEM'
                                                            ? (Number(selectedService.pricePer1000) / 1000).toFixed(4)
                                                            : Number(selectedService.pricePer1000).toFixed(2)}₽
                                                    </div>
                                                    <div className="text-[8px] uppercase opacity-30 font-bold">
                                                        {priceUnit === 'ITEM' ? 'за 1 шт.' : 'за 1000 шт.'}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed line-clamp-2 uppercase italic tracking-widest mb-4">
                                                {selectedService.description || "ОПИСАНИЕ НЕ ЗАПОЛНЕНО"}
                                            </p>

                                            {/* Requirements Preview */}
                                            {selectedService.requirements && (
                                                <div className="cyber-box bg-rose-500/10 border-rose-500/20 p-4 mb-4 relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent" />
                                                    <div className="flex items-center gap-2 text-[8px] font-black text-rose-500 uppercase tracking-widest mb-2 relative z-10">
                                                        <AlertTriangle size={10} className="animate-pulse" /> SYSTEM_REQUIREMENTS
                                                    </div>
                                                    <p className="text-[9px] text-rose-200 font-bold uppercase italic leading-tight relative z-10">
                                                        {selectedService.requirements}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-40">
                                                <span>Мин: {selectedService.minQty}</span>
                                                <span>Лимит: {selectedService.maxQty}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="w-20 h-20 cyber-box border-white/10 flex items-center justify-center bg-white/5 text-slate-800"
                            >
                                <LayoutGrid size={40} />
                            </motion.div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-widest italic tracking-tighter">Выберите услугу для курации</h3>
                                <p className="text-[10px] text-slate-500 max-w-xs mx-auto uppercase tracking-widest font-bold leading-relaxed">
                                    Отредактируйте параметры, добавьте требования и включите видимость на витрине.
                                </p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--primary);
                }
            `}</style>
        </div>
    );
}


