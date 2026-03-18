'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Database, Search, Loader2, Plus } from 'lucide-react';
import { linkProviderService } from '@/app/admin/services/actions';
import { toast } from 'sonner';

interface ProviderService {
  id: number;
  name: string;
  rawPrice: any;
  providerId: string;
  platform?: string;
  category?: string;
}

export function ProviderLinker({
  internalServiceId,
  internalServiceName,
  providers,
  availableServices
}: {
  internalServiceId: string,
  internalServiceName: string,
  providers: { id: string, name: string }[],
  availableServices: ProviderService[]
}) {
  const [selectedProvider, setSelectedProvider] = useState(providers[0]?.id || '');
  const [search, setSearch] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Extract platform & category lists for the active provider
  const providerServices = availableServices.filter(s => s.providerId === selectedProvider);
  const platforms = Array.from(new Set(providerServices.map(s => s.platform).filter(Boolean))) as string[];
  const categories = Array.from(new Set(providerServices.filter(s => selectedPlatform === 'ALL' || s.platform === selectedPlatform).map(s => s.category).filter(Boolean))) as string[];

  // Фильтруем услуги по выбранному провайдеру, фильтрам и поисковой строке
  const filteredServices = providerServices.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toString().includes(search);
    const matchPlatform = selectedPlatform === 'ALL' || s.platform === selectedPlatform;
    const matchCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchSearch && matchPlatform && matchCategory;
  });

  const shouldShowFilters = selectedPlatform !== 'ALL' || selectedCategory !== 'ALL' || search.length > 0;
  const displayLimit = shouldShowFilters ? 50 : 10;

  // Группировка
  const groupedServices = filteredServices.slice(0, displayLimit).reduce((acc, s) => {
    const key = (s.platform && s.category) ? `${s.platform} / ${s.category}` : (s.category || 'OTHER');
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, typeof filteredServices>);

  // Поиск предложений на основе названия внутренней услуги
  const suggestions = (!shouldShowFilters) ? providerServices.filter(s => {
    // Очень простой матчинг: если хотя бы 2 слова из названия совпадают (игнорируя мелкие слова)
    const internalWords = internalServiceName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const providerWords = s.name.toLowerCase().split(/\s+/);
    const matches = internalWords.filter(w => providerWords.includes(w));
    return matches.length >= 1;
  }).slice(0, 5) : [];

  const handleLink = async (providerSvcId: number) => {
    setIsLinking(true);
    try {
      const res = await linkProviderService(internalServiceId, selectedProvider, providerSvcId.toString());
      if (res.success) {
        toast.success('Провайдер успешно подключен!');
        setSearch('');
        // Reload to show the new mapping in MappingList
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('Ошибка: ' + res.error);
      }
    } catch (e) {
      toast.error('Ошибка сети: ' + (e as any).message);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Database size={14} className="text-blue-500" />
          Подключение Провайдера
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Row 1: Provider & Search */}
        <div className="flex gap-2">
          <select
            value={selectedProvider}
            onChange={(e) => {
              setSelectedProvider(e.target.value);
              setSelectedPlatform('ALL');
              setSelectedCategory('ALL');
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[120px]"
          >
            {providers.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
          </select>

          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input
              type="text"
              placeholder="Поиск услуги провайдера..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-600 truncate"
            />
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="flex gap-2">
          <select
            value={selectedPlatform}
            onChange={(e) => {
              setSelectedPlatform(e.target.value);
              setSelectedCategory('ALL'); // reset category when platform changes
            }}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Все платформы</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Все категории</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-4 mt-2">
          {shouldShowFilters ? (
            Object.entries(groupedServices).map(([groupName, svcs]) => (
              <div key={groupName} className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 bg-slate-950/80 sticky top-0 py-1">
                  {groupName} <span className="text-slate-600 opacity-60 ml-1">({svcs.length})</span>
                </div>
                {svcs.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-800 rounded-xl border border-slate-800/50 transition-colors group">
                    <div className="min-w-0 pr-2">
                      <div className="text-[11px] font-bold text-slate-200 truncate" title={s.name}>{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {s.id} &bull; Cost: {Number(s.rawPrice).toFixed(4)}₽</div>
                    </div>
                    <button
                      onClick={() => handleLink(s.id)}
                      disabled={isLinking}
                      className="p-1.5 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      {isLinking ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <>
              {suggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-1 flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Рекомендуемые аналоги
                  </div>
                  {suggestions.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-emerald-950/20 hover:bg-emerald-900/40 rounded-xl border border-emerald-900/50 transition-colors group">
                      <div className="min-w-0 pr-2">
                        <div className="text-[11px] font-bold text-slate-200 truncate" title={s.name}>{s.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {s.id} &bull; Cost: {Number(s.rawPrice).toFixed(4)}₽</div>
                      </div>
                      <button
                        onClick={() => handleLink(s.id)}
                        disabled={isLinking}
                        className="p-1.5 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        {isLinking ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1 pt-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Недавно обновленные</div>
                {Object.values(groupedServices).flat().slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-800 rounded-xl border border-slate-800/50 transition-colors group">
                    <div className="min-w-0 pr-2">
                      <div className="text-[11px] font-bold text-slate-200 truncate" title={s.name}>{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {s.id} &bull; Cost: {Number(s.rawPrice).toFixed(4)}₽</div>
                    </div>
                    <button
                      onClick={() => handleLink(s.id)}
                      disabled={isLinking}
                      className="p-1.5 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      {isLinking ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {shouldShowFilters && Object.keys(groupedServices).length === 0 && (
            <div className="text-[10px] text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">
              Ничего не найдено по фильтрам.<br />Попробуйте изменить поисковой запрос.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


