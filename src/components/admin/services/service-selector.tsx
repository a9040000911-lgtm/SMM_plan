'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Search, Hash, Database } from 'lucide-react';

interface Provider {
    id: string;
    name: string;
}

interface ProviderService {
    id: number;
    name: string;
    rawPrice: number;
    providerName: string;
}

export function ServiceSelector({
    providers,
    availableServices,
    onSelect
}: {
    providers: Provider[],
    availableServices: ProviderService[],
    onSelect?: (service: ProviderService) => void
}) {
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [search, setSearch] = useState('');
    const [selectedService, setSelectedService] = useState<ProviderService | null>(null);

    const filteredServices = availableServices
        .filter(s => s.providerName === selectedProvider)
        .filter(s =>
            !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.id.toString().includes(search)
        )
        .slice(0, 50);

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProvider(e.target.value);
        setSelectedService(null);
        setSearch('');
    };

    const handleServiceSelect = (service: ProviderService) => {
        setSelectedService(service);
        if (onSelect) onSelect(service);
    };

    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <Database className="text-blue-400" size={20} />
                <h3 className="font-bold uppercase tracking-tighter">API Mapping (Bridge)</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Provider Source</label>
                    <select
                        name="providerName"
                        value={selectedProvider}
                        onChange={handleProviderChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="">Select Provider...</option>
                        {providers.map(p => (
                            <option key={p.id} value={p.name} className="text-slate-900">{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                        <Hash size={10} /> Provider Service ID
                    </label>
                    <div className="relative">
                        <input
                            name="providerServiceId"
                            type="number"
                            value={selectedService?.id || ''}
                            onChange={(e) => {
                                // Allow manual override
                                setSelectedService(prev => prev ? { ...prev, id: Number(e.target.value) } : { id: Number(e.target.value), name: 'Manual Entry', rawPrice: 0, providerName: selectedProvider });
                            }}
                            placeholder="Auto-filled or Manual"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        {selectedService && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                                {Number(selectedService.rawPrice).toFixed(4)}₽
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedProvider && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${selectedProvider} services...`}
                            className="w-full pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {filteredServices.map(s => (
                            <div
                                key={s.id}
                                onClick={() => handleServiceSelect(s)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selectedService?.id === s.id
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 text-slate-400'
                                    }`}
                            >
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className={`text-[11px] font-bold truncate ${selectedService?.id === s.id ? 'text-white' : 'text-slate-300'}`}>{s.name}</div>
                                    <div className="text-[9px] font-mono opacity-60">ID: {s.id}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-[10px] font-bold ${selectedService?.id === s.id ? 'text-white' : 'text-emerald-500'}`}>
                                        {Number(s.rawPrice).toFixed(3)}₽
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-500 italic text-center">
                        Select a service from the list to auto-fill the ID and link it.
                    </p>
                </div>
            )}
        </div>
    );
}


