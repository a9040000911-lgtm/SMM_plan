"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button, AdminCard } from '@/components/admin/ui';
import { Save, Check, Settings2, X } from 'lucide-react';
import { saveServiceOverrides } from '@/app/admin/services/overrides-actions';
import { usePriceDisplay } from './price-display-context';

interface Project {
  id: string;
  name: string;
  brandColor: string;
}

interface Override {
  projectId: string;
  customPrice: string | null;
  isActive: boolean;
  customName?: string | null;
  customDescription?: string | null;
}

interface ServiceOverridesProps {
  serviceId: string;
  basePrice: number;
  projects: Project[];
  initialOverrides: Override[];
}

export function ServiceOverrides({ serviceId, basePrice, projects, initialOverrides }: ServiceOverridesProps) {
  const [overrides, setOverrides] = useState<Record<string, { customPrice: string, isActive: boolean, customName: string, customDescription: string }>>(() => {
    const map: Record<string, { customPrice: string, isActive: boolean, customName: string, customDescription: string }> = {};
    projects.forEach(p => {
      const existing = initialOverrides.find(o => o.projectId === p.id);
      map[p.id] = {
        customPrice: existing?.customPrice?.toString() || '',
        isActive: existing ? existing.isActive : true,
        customName: existing?.customName || '',
        customDescription: existing?.customDescription || ''
      };
    });
    return map;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const { formatPrice, unit, currency } = usePriceDisplay();

  // Modal state
  const [editingProject, setEditingProject] = useState<string | null>(null);

  const handlePriceChange = (projectId: string, val: string) => {
    setOverrides(prev => ({
      ...prev,
      [projectId]: { ...prev[projectId], customPrice: val }
    }));
  };

  const toggleActive = (projectId: string) => {
    setOverrides(prev => ({
      ...prev,
      [projectId]: { ...prev[projectId], isActive: !prev[projectId].isActive }
    }));
  };

  const handleFieldChange = (projectId: string, field: 'customName' | 'customDescription', val: string) => {
    setOverrides(prev => ({
      ...prev,
      [projectId]: { ...prev[projectId], [field]: val }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveServiceOverrides(serviceId, overrides);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (_e) {
      alert('Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AdminCard
        title="Цены по платформам"
        action={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className={justSaved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
          >
            {justSaved ? <Check size={16} /> : <Save size={16} />}
            <span className="ml-2">{isSaving ? 'Сохранение...' : justSaved ? 'Сохранено' : 'Сохранить все'}</span>
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-700">
                <th className="px-6 py-3">Платформа</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3">Цена ({unit === 1 ? '1 шт' : '1000'}) в {currency}</th>
                <th className="px-6 py-3 text-right">Наценка</th>
                <th className="px-6 py-3 text-right">Настройки</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {projects.map(project => {
                const state = overrides[project.id];
                const displayPrice = state.customPrice ? parseFloat(state.customPrice) : basePrice;
                const markup = ((displayPrice - basePrice) / basePrice) * 100;

                return (
                  <tr key={project.id} className={!state.isActive ? 'opacity-50 grayscale' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.brandColor }} />
                        <span className="font-bold">{project.name}</span>
                        {(state.customName || state.customDescription) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Есть кастомные данные" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(project.id)}
                        className={`px-2 py-1 rounded text-[10px] font-black uppercase transition-colors ${state.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          }`}
                      >
                        {state.isActive ? 'Активна' : 'Скрыта'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={state.customPrice}
                          onChange={(e) => handlePriceChange(project.id, e.target.value)}
                          placeholder={(unit === 1 ? basePrice / 1000 : basePrice).toString()}
                          className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                        <span className="text-[10px] text-slate-400 italic">базовая: {formatPrice(basePrice)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs font-bold ${markup >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {markup > 0 ? '+' : ''}{markup.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingProject(project.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                      >
                        <Settings2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Advanced Settings Modal */}
      {editingProject && (() => {
        const project = projects.find(p => p.id === editingProject)!;
        const state = overrides[editingProject];

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.brandColor }} />
                  <h3 className="font-bold text-slate-800">Настройки для {project.name}</h3>
                </div>
                <button
                  onClick={() => setEditingProject(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Индивидуальное название
                  </label>
                  <input
                    type="text"
                    value={state.customName}
                    onChange={(e) => handleFieldChange(editingProject, 'customName', e.target.value)}
                    placeholder="Используется основное название"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Индивидуальное описание
                  </label>
                  <textarea
                    rows={6}
                    value={state.customDescription}
                    onChange={(e) => handleFieldChange(editingProject, 'customDescription', e.target.value)}
                    placeholder="Используется основное описание"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                  />
                </div>

                <Button
                  className="w-full mt-2"
                  onClick={() => setEditingProject(null)}
                >
                  Готово
                </Button>
                <p className="text-[10px] text-center text-slate-400">
                  Не забудьте нажать "Сохранить все" в основной таблице
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}


