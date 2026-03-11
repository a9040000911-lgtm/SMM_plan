'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import {
  Search,
  Layers,
  CheckCircle2,
  AlertCircle,
  PackagePlus,
  Loader2,
  Filter
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import { Sparkles } from 'lucide-react';
import { InfoTooltip } from '@/components/admin/core/info-tooltip';
import { toast } from 'sonner';
import { getActivityLabel } from '@/utils/order-utils';

import {
  PLATFORMS, CATEGORIES, PLATFORM_LABELS, TARGET_TYPES,
  SmartAnalyzerLogic as SmartAnalyzerService
} from '@/services/providers/smart-analyzer.logic';
// No tier/group actions needed

export default function ServiceImportPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [customTargetTypes, setCustomTargetTypes] = useState<Record<string, string>>({});
  const [customIsPrivate, setCustomIsPrivate] = useState<Record<string, boolean>>({});
  const [hideImported, setHideImported] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [priceUnit, setPriceUnit] = useState<'1' | '1000'>('1000');
  const [currency, setCurrency] = useState<'RUB' | 'USD'>('RUB');

  // Tiers and Groups state removed

  const EXCHANGE_RATE = 95; // Approximate rate for display

  useEffect(() => {
    // Fetch Providers
    fetch('/api/admin/providers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProviders(data);
        }
      })
      .catch(console.error);

    // Category and project loading logic remains if any
  }, []);

  const handleAIAnalyze = async () => {
    if (selectedIds.size === 0) return;
    setIsAnalyzing(true);

    const namesToAnalyze = services
      .filter(s => selectedIds.has(`${s.providerName}_${s.id}`))
      .map(s => s.name);

    try {
      const res = await fetch('/api/admin/services/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: namesToAnalyze })
      });
      const data = await res.json();

      const newCustomTypes = { ...customTargetTypes };
      const newCustomPrivate = { ...customIsPrivate };
      data.forEach((item: any) => {
        if (item.analysis) {
          // Находим ID услуги по имени
          const service = services.find(s => s.name === item.name);
          if (service) {
            const rowId = `${service.providerName}_${service.id}`;
            newCustomTypes[rowId] = item.analysis.targetType;
            newCustomPrivate[rowId] = item.analysis.isPrivate;
          }
        }
      });
      setCustomTargetTypes(newCustomTypes);
      setCustomIsPrivate(newCustomPrivate);
      toast.success('AI анализ завершен. Типы ссылок и приватность обновлены.');
    } catch (_e) {
      toast.error('Ошибка AI анализа');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  const fetchServices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/admin/services/import', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());

      if (search) url.searchParams.set('search', search);
      if (providerFilter) url.searchParams.set('provider', providerFilter);
      // Теперь передаём фильтры платформы и категории на сервер
      if (platformFilter) url.searchParams.set('platform', platformFilter);
      if (categoryFilter) url.searchParams.set('category', categoryFilter);
      if (hideImported) url.searchParams.set('hideImported', 'true');
      if (minPrice) url.searchParams.set('minPrice', minPrice);
      if (maxPrice) url.searchParams.set('maxPrice', maxPrice);
      if (sortOrder) url.searchParams.set('sort', sortOrder);

      const res = await fetch(url.toString());
      const responseData = await res.json();

      if (responseData.data) {
        setServices(responseData.data);
        setTotalItems(responseData.meta.total);
        setTotalPages(responseData.meta.totalPages);
      } else {
        setServices([]);
      }
    } catch (_error) {
      console.error('Ошибка загрузки услуг:', _error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, providerFilter, platformFilter, categoryFilter, hideImported, minPrice, maxPrice, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Сброс на первую страницу при изменении фильтра
      fetchServices();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, providerFilter, platformFilter, categoryFilter, hideImported, minPrice, maxPrice, sortOrder]); // fetchServices removed to avoid loop

  useEffect(() => {
    fetchServices();
  }, [page, fetchServices]); // Загрузка при смене страницы

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    const importableInView = services.filter(s => (s.mappings?.length || 0) === 0);
    if (importableInView.length === 0) return;

    const allSelected = importableInView.every(s => selectedIds.has(`${s.providerName}_${s.id}`));

    if (allSelected) {
      // Unselect specific items from current view? Or clear all?
      // Current behavior suggests page-based selection, so let's clear all for simplicity 
      // OR better: remove only current view items from set to support multi-page selection
      const next = new Set(selectedIds);
      importableInView.forEach(s => next.delete(`${s.providerName}_${s.id}`));
      setSelectedIds(next);
    } else {
      // Add current view items to set
      const next = new Set(selectedIds);
      importableInView.forEach(s => next.add(`${s.providerName}_${s.id}`));
      setSelectedIds(next);
    }
  };

  const handleBulkImport = async () => {
    if (selectedIds.size === 0) return;

    const confirmMsg = `Вы действительно хотите импортировать ${selectedIds.size} услуг?`;

    if (!confirm(confirmMsg)) return;

    setIsImporting(true);
    const servicesToImport = services
      .filter(s => selectedIds.has(`${s.providerName}_${s.id}`))
      .map(s => {
        const platform = s.platform;
        const category = s.category;
        const rawPrice = Number(s.rawPrice);
        const rowId = `${s.providerName}_${s.id}`;

        return {
          id: `${platform}_${category}_${s.id}`.toLowerCase(),
          name: s.name,
          platform,
          category,
          targetType: customTargetTypes[rowId] || SmartAnalyzerService.suggestTargetType(s.name, category, s.rawData?.description || ''),
          isPrivate: customIsPrivate[rowId] !== undefined ? customIsPrivate[rowId] : SmartAnalyzerService.suggestIsPrivate(s.name),
          pricePer1000: Math.max(rawPrice * 1.5, rawPrice + 50),
          minQty: s.rawData?.min || 10,
          maxQty: s.rawData?.max || 100000,
          description: s.rawData?.description || 'Импортировано из API.',
          providerId: s.id,
          providerName: s.providerName,
          providerUUID: s.providerId, // Pass the actual Provider UUID
          rawData: s.rawData,
          priceUnit: priceUnit === '1' ? 1 : 1000,
          unitName: priceUnit === '1' ? 'шт.' : '1000 шт.',
        };
      });

    try {
      const res = await fetch('/api/admin/services/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servicesToImport)
      });
      if (res.ok) {
        toast.success(`Успешно импортировано услуг: ${servicesToImport.length}`);
        setSelectedIds(new Set());
        fetchServices();
      }
    } catch (_error) {
      toast.error('Ошибка при массовом импорте');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic uppercase">Импорт услуг</h2>
          <p className="text-sm text-slate-500 font-medium">Массовое добавление услуг из внешних API провайдеров.</p>
        </div>

        <div className="flex items-center gap-3 self-start xl:self-auto flex-wrap">
          {/* Toggles */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setPriceUnit('1000')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${priceUnit === '1000' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              За 1000
            </button>
            <button
              onClick={() => setPriceUnit('1')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${priceUnit === '1' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              За 1 шт
            </button>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCurrency('RUB')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${currency === 'RUB' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              RUB
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${currency === 'USD' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              USD
            </button>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-200">

              {/* Tiers and Groups selection removed */}

              <button
                onClick={handleAIAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl text-sm font-black uppercase hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                AI
              </button>
              <button
                onClick={handleBulkImport}
                disabled={isImporting}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
              >
                {isImporting ? <Loader2 className="animate-spin" size={18} /> : <PackagePlus size={18} />}
                Импорт ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ФИЛЬТРЫ */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-400 mb-2 px-2">
          <Filter size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Быстрые фильтры</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Поиск по названию или ID..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
          >
            <option value="">Все провайдеры</option>
            {providers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          <select
            className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="">Все соцсети</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p] || p}</option>)}
          </select>

          <select
            className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Все категории</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{getActivityLabel(c)}</option>)}
          </select>

          {/* New Price Filter Row */}
          <div className="lg:col-span-2 grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Мин. цена"
              className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number"
              placeholder="Макс. цена"
              className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <select
              className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="">Без сортировки</option>
              <option value="price_asc">Цена: По возрастанию</option>
              <option value="price_desc">Цена: По убыванию</option>
            </select>
          </div>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={hideImported}
              onChange={(e) => setHideImported(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-600">Скрыть добавленные</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={
                    (() => {
                      const importable = services.filter(s => (s.mappings?.length || 0) === 0);
                      return importable.length > 0 && importable.every(s => selectedIds.has(`${s.providerName}_${s.id}`));
                    })()
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Провайдер</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Тип</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Приват</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Название услуги</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Цена</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((s) => {
              const rowId = `${s.providerName}_${s.id}`;
              const isImported = (s.mappings?.length || 0) > 0;
              const isSelected = selectedIds.has(rowId);

              return (
                <tr key={rowId} className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    {isImported ? (
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="w-4 h-4 rounded border-slate-300 text-slate-400 bg-slate-100 cursor-not-allowed"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={isSelected}
                        onChange={() => toggleSelect(rowId)}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-tight">
                      {s.providerName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const currentCat = SmartAnalyzerService.suggestCategory(s.name, s.rawData?.category || '');
                      const currentType = customTargetTypes[rowId] || SmartAnalyzerService.suggestTargetType(s.name, currentCat, s.rawData?.description || '');
                      const isMismatched = (currentCat === 'SUBSCRIBERS' && currentType === 'POST');

                      return (
                        <div className="relative group/type">
                          <select
                            className={`bg-slate-50 border-none rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-blue-500/30 py-1 ${isMismatched ? 'text-red-600 bg-red-50' : 'text-slate-600'}`}
                            value={currentType}
                            onChange={(e) => setCustomTargetTypes({ ...customTargetTypes, [rowId]: e.target.value })}
                          >
                            {TARGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {isMismatched && (
                            <div className="absolute top-full left-0 mt-1 hidden group-hover/type:block bg-red-600 text-white text-[9px] p-2 rounded shadow-lg z-50 w-32">
                              ⚠️ Подписчики обычно для КАНАЛА, а не для Поста.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={customIsPrivate[rowId] !== undefined ? customIsPrivate[rowId] : SmartAnalyzerService.suggestIsPrivate(s.name)}
                      onChange={(e) => setCustomIsPrivate({ ...customIsPrivate, [rowId]: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col max-w-md">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-700 leading-snug">{s.name}</span>
                        {s.rawData?.description && (
                          <InfoTooltip text={s.rawData.description} position="right" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{PLATFORM_LABELS[s.platform] || s.platform}</span>
                        <span className="text-[9px] font-black text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded uppercase">{getActivityLabel(s.category)}</span>
                        <span className="text-[9px] font-mono text-slate-400 italic">ID: {s.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 tabular-nums">
                    {(() => {
                      let price = Number(s.rawPrice);
                      if (currency === 'USD') price = price / EXCHANGE_RATE;
                      if (priceUnit === '1') price = price / 1000;

                      return (
                        <span>
                          {currency === 'USD' ? '$' : ''}
                          {formatAmount(price)}
                          {currency === 'RUB' ? '₽' : ''}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isImported ? (
                      <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] uppercase">В каталоге</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 text-slate-400 font-bold">
                        <AlertCircle size={14} />
                        <span className="text-[10px] uppercase">Доступно</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {services.length === 0 && !isLoading && (
          <div className="p-20 text-center">
            <Layers size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">Ничего не найдено с такими фильтрами.</p>
          </div>
        )}
      </div>

      {/* ПАГИНАЦИЯ */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 gap-4">
        <div className="text-xs text-slate-500 font-bold">
          Показано {services.length} из {totalItems} услуг
        </div>

        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="px-3 py-2 text-xs font-bold bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Назад
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {(() => {
              const pages = [];
              const maxVisiblePages = 5; // How many pages to show directly

              if (totalPages <= maxVisiblePages + 2) {
                // If total pages are small, show all
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Complex logic for many pages
                if (page <= 3) {
                  // Near start: 1, 2, 3, 4 ... Last
                  for (let i = 1; i <= 4; i++) pages.push(i);
                  pages.push('...');
                  pages.push(totalPages);
                } else if (page >= totalPages - 2) {
                  // Near end: 1 ... N-3, N-2, N-1, N
                  pages.push(1);
                  pages.push('...');
                  for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
                } else {
                  // Middle: 1 ... P-1, P, P+1 ... Last
                  pages.push(1);
                  pages.push('...');
                  pages.push(page - 1);
                  pages.push(page);
                  pages.push(page + 1);
                  pages.push('...');
                  pages.push(totalPages);
                }
              }

              return pages.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400 font-bold select-none">
                      ...
                    </span>
                  );
                }

                const pageNum = Number(p);
                const isActive = pageNum === page;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={isLoading}
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all
                      ${isActive
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="px-3 py-2 text-xs font-bold bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Вперед
          </button>
        </div>
      </div>
    </div>
  );
}
