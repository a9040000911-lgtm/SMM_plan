'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

import { getServicesForFilter, FilterServiceItem } from '@/app/admin/orders/filter-actions';
import { DatePicker } from '@/components/admin/ui/date-picker';
import type { Category, Platform } from '@/generated/client';
import { useState, useEffect } from 'react';
import { getActivityLabel } from '@/utils/order-utils';

export function OrderFilter({
  initialSearch,
  initialStatus,
  initialPlatform,
  initialProjectId,
  initialProvider,
  initialCategory,
  initialServiceId,
  initialDateFrom,
  initialDateTo,
  statusMap,
  projects,
  providers,
  platforms,
  categories
}: {
  initialSearch: string,
  initialStatus: string,
  initialPlatform: string,
  initialProjectId: string,
  initialProvider: string,
  initialCategory: string,
  initialServiceId: string,
  initialDateFrom: string,
  initialDateTo: string,
  statusMap: Record<string, string>,
  projects: Array<{ id: string; name: string; color: string }>,
  providers: Array<{ id: string; name: string }>,
  platforms: string[],
  categories: string[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<FilterServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Find selected project for styling
  const selectedProject = projects.find(p => p.id === initialProjectId);

  // Fetch services when platform or category changes
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const platform = (initialPlatform === 'ALL' ? undefined : initialPlatform) as Platform | undefined;
        const category = (initialCategory === 'ALL' ? undefined : initialCategory) as Category | undefined;
        // Only fetch if platform or category is selected to avoid loading all services
        if (platform || category) {
          const data = await getServicesForFilter(platform, category);
          setServices(data);
        } else {
          setServices([]);
        }
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [initialPlatform, initialCategory]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set('search', search);
    else params.delete('search');

    // Reset page on filter change
    params.set('page', '1');

    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') params.set(key, value);
    else params.delete(key);

    // Reset dependent filters
    if (key === 'platform') {
      params.delete('serviceId');
      // Optional: reset category if platform changes? No, keep logic flexible.
    }
    if (key === 'category') {
      params.delete('serviceId');
    }

    // Reset page on filter change
    params.set('page', '1');

    router.push(`/admin/orders?${params.toString()}`);
  };

  // const categories = Object.values(Category);

  return (
    <div
      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4 transition-colors duration-300 relative overflow-hidden"
      style={{
        background: selectedProject
          ? `linear-gradient(to right, ${selectedProject.color}08, #ffffff)`
          : '#ffffff',
        borderColor: selectedProject ? `${selectedProject.color}40` : undefined
      }}
    >
      {selectedProject && (
        <div
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: selectedProject.color }}
        />
      )}

      {/* Project Switcher */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center pb-2 mb-2 border-b border-slate-100">
          <button
            onClick={() => handleFilterChange('projectId', 'ALL')}
            className={`px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all ${initialProjectId === 'ALL'
              ? 'bg-slate-800 text-white shadow-md shadow-slate-200'
              : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
          >
            Все
          </button>
          {projects?.filter(p => !!p).map(p => {
            const isSelected = initialProjectId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleFilterChange('projectId', p.id)}
                className={`px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 border`}
                style={{
                  backgroundColor: isSelected ? p.color : '#ffffff',
                  color: isSelected ? '#ffffff' : '#64748b',
                  borderColor: isSelected ? p.color : '#e2e8f0',
                  textShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {!isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                )}
                {p.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Search Bar - Full Width */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <form onSubmit={handleSearch}>
            <input
              type="text"
              name="search"
              defaultValue={initialSearch}
              placeholder="ID, Почта, TG ID или Ссылка..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 transition-all shadow-sm"
              style={{
                '--tw-ring-color': selectedProject ? `${selectedProject.color}30` : 'rgba(59, 130, 246, 0.2)',
                borderColor: selectedProject ? `${selectedProject.color}40` : undefined
              } as React.CSSProperties}
            />
          </form>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">

          {/* 1. Status */}
          <select
            className="bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 transition-all shadow-sm"
            style={{
              '--tw-ring-color': selectedProject ? `${selectedProject.color}30` : 'rgba(59, 130, 246, 0.2)',
              borderColor: selectedProject ? `${selectedProject.color}40` : undefined
            } as React.CSSProperties}
            defaultValue={initialStatus || 'ALL'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="ALL">Все статусы</option>
            {Object.entries(statusMap || {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          {/* 2. Platform */}
          <select
            className="bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 transition-all shadow-sm"
            style={{
              '--tw-ring-color': selectedProject ? `${selectedProject.color}30` : 'rgba(59, 130, 246, 0.2)',
              borderColor: selectedProject ? `${selectedProject.color}40` : undefined
            } as React.CSSProperties}
            defaultValue={initialPlatform || 'ALL'}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
          >
            <option value="ALL">Все сети</option>
            {platforms?.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* 3. Category */}
          <select
            className="bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 transition-all shadow-sm"
            style={{
              '--tw-ring-color': selectedProject ? `${selectedProject.color}30` : 'rgba(59, 130, 246, 0.2)',
              borderColor: selectedProject ? `${selectedProject.color}40` : undefined
            } as React.CSSProperties}
            defaultValue={initialCategory || 'ALL'}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="ALL">Все категории</option>
            {categories?.map(c => <option key={c} value={c}>{getActivityLabel(c)}</option>)}
          </select>

          {/* 4. Provider */}
          <select
            className="bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 transition-all shadow-sm"
            style={{
              '--tw-ring-color': selectedProject ? `${selectedProject.color}30` : 'rgba(59, 130, 246, 0.2)',
              borderColor: selectedProject ? `${selectedProject.color}40` : undefined
            } as React.CSSProperties}
            defaultValue={initialProvider || 'ALL'}
            onChange={(e) => handleFilterChange('provider', e.target.value)}
          >
            <option value="ALL">Все провайдеры</option>
            {providers?.filter(p => !!p).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>

          {/* 5. Date From */}
          <DatePicker
            placeholder="Дата (с)"
            value={initialDateFrom ? new Date(initialDateFrom) : undefined}
            onChange={(date) => handleFilterChange('dateFrom', date ? date.toISOString().split('T')[0] : '')}
            style={{
              '--tw-ring-color': selectedProject ? `${selectedProject.color}30` : 'rgba(59, 130, 246, 0.2)',
              borderColor: selectedProject ? `${selectedProject.color}40` : undefined
            } as React.CSSProperties}
          />

          {/* 6. Date To */}
          <DatePicker
            placeholder="Дата (по)"
            value={initialDateTo ? new Date(initialDateTo) : undefined}
            onChange={(date) => handleFilterChange('dateTo', date ? date.toISOString().split('T')[0] : '')}
            style={{
              '--tw-ring-color': selectedProject ? `${selectedProject.color}30` : 'rgba(59, 130, 246, 0.2)',
              borderColor: selectedProject ? `${selectedProject.color}40` : undefined
            } as React.CSSProperties}
          />
        </div>

        {/* Optional Row: Services (only if platform/category selected and services available) */}
        {(services.length > 0 || initialServiceId !== 'ALL') && (
          <div className="w-full">
            <select
              className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 transition-all shadow-sm truncat"
              style={{
                '--tw-ring-color': selectedProject ? `${selectedProject.color}30` : 'rgba(59, 130, 246, 0.2)',
                borderColor: selectedProject ? `${selectedProject.color}40` : undefined
              } as React.CSSProperties}
              defaultValue={initialServiceId || 'ALL'}
              onChange={(e) => handleFilterChange('serviceId', e.target.value)}
              disabled={loadingServices}
            >
              <option value="ALL">Все услуги (фильтрация по тарифу)</option>
              {services?.filter(s => !!s).map(s => <option key={s.id} value={s.id}>[{s.id}] {s.name} ({s.category})</option>)}
            </select>
            {loadingServices && <span className="text-[10px] text-slate-400 ml-2">Загрузка услуг...</span>}
          </div>
        )}
      </div>
    </div>
  );
}


