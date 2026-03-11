'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Save, Loader2, Sparkles, Trash2, Power, PowerOff, LayoutGrid, AlertTriangle, Database, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateService, deleteService, enhanceDescriptionAction } from '@/app/admin/services/actions';
import { SerializedService } from '@/types/admin';
import { ActionButton, StatusBadge } from '@/components/admin/ui';
import { toast } from 'sonner';
import { usePriceDisplay } from './price-display-context';
import { ServiceHistory } from './service-history';
import { X } from 'lucide-react';

import { Platform, Category } from '@/generated/client';

const TARGET_TYPES = [
  { value: 'TG_CHANNEL', label: 'Telegram: Канал/Группа' },
  { value: 'TG_POST', label: 'Telegram: Пост/Фото' },
  { value: 'TG_STORY', label: 'Telegram: История' },
  { value: 'IG_PROFILE', label: 'Instagram: Профиль' },
  { value: 'IG_POST', label: 'Instagram: Пост/Reel' },
  { value: 'VK_PROFILE', label: 'VK: Профиль' },
  { value: 'VK_GROUP', label: 'VK: Группа/Паблик' },
  { value: 'VK_WALL', label: 'VK: Пост на стене' },
  { value: 'YT_CHANNEL', label: 'YouTube: Канал' },
  { value: 'YT_VIDEO', label: 'YouTube: Видео/Shorts' },
  { value: 'TT_PROFILE', label: 'TikTok: Профиль' },
  { value: 'TT_VIDEO', label: 'TikTok: Видео' },
  { value: 'ALL', label: 'Универсальный (любая ссылка)' }
];

interface ServiceEditorProps {
  service: SerializedService;
  allRegularServices?: any[];
  allProjects?: any[];
  allCategories?: any[];
  initialProjectOverrides?: any[];
  activeProjectId?: string | null;
}

export function ServiceEditor({
  service,
  allRegularServices: _allRegularServices = [],
  allProjects: _allProjects = [],
  allCategories = [],
  initialProjectOverrides = [],
  activeProjectId = null
}: ServiceEditorProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [isBusy, setIsBusy] = useState(false);
  const { currency, unit, setCurrency, setUnit: _setUnit, formatPrice } = usePriceDisplay();

  const [formData, setFormData] = useState({
    name: service.name,
    description: service.description,
    pricePer1000: Number(service.pricePer1000),
    isActive: service.isActive,
    targetType: service.targetType,
    allowedTargetTypes: service.allowedTargetTypes || [],
    guaranteeDays: service.guaranteeDays || 0,
    requirements: service.requirements || '',
    minQty: service.minQty || 10,
    maxQty: service.maxQty || 100000,
    markup: service.markup ? Number(service.markup) : 0,
    platform: service.platform as Platform,
    categoryId: (activeProjectId && activeProjectId !== 'all')
      ? (initialProjectOverrides.find((o: any) => o.projectId === activeProjectId)?.categoryId || service.categoryId || '')
      : (service.categoryId || ''),
    category: service.category as Category // maintaining enum for now
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredCategories = allCategories.filter(c => c.platform === formData.platform);

  // Financial Analysis
  const cost = Number(service.lastProviderPrice) || 0;

  // Real-time calculations based on formData
  const currentPrice = formData.pricePer1000;
  const profit = currentPrice - cost;

  const handleMagicDescription = async () => {
    setIsGenerating(true);
    try {
      const res = await enhanceDescriptionAction(service.id, formData.description);
      if (res.success && res.description) {
        setFormData({ ...formData, description: res.description });
        toast.success('Описание улучшено AI');
      } else {
        toast.error(res.error || 'Ошибка при генерации');
      }
    } catch (_e) {
      toast.error('Ошибка при генерации описания');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsBusy(true);
    try {
      await updateService(service.id, formData);
      toast.success('Услуга успешно обновлена');
    } catch (_e) {
      const message = _e instanceof Error ? _e.message : 'Неизвестная ошибка';
      toast.error('Ошибка сохранения: ' + message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите НАВСЕГДА УДАЛИТЬ эту услугу? Это действие нельзя отменить.')) return;
    setIsBusy(true);
    try {
      const res = await deleteService(service.id);
      if (res.success) {
        toast.success('Услуга удалена');
        window.location.href = '/admin/services';
      } else {
        toast.error(res.error || 'Ошибка удаления');
      }
    } catch (_e) {
      toast.error('Критическая ошибка при удалении');
    } finally {
      setIsBusy(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = !formData.isActive;
    setFormData({ ...formData, isActive: newStatus });
    setIsBusy(true);
    try {
      await updateService(service.id, { isActive: newStatus });
      toast.success(newStatus ? 'Услуга включена' : 'Услуга отключена');
    } catch (_e) {
      toast.error('Ошибка при переключении статуса');
      setFormData({ ...formData, isActive: !newStatus });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
            <LayoutGrid size={14} />
            Управление тарифом
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            {formData.name || 'Без названия'}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-500">ID: {service.id}</span>
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <StatusBadge isActive={formData.isActive} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleStatus}
            disabled={isBusy}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
              formData.isActive
                ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
            )}
          >
            {formData.isActive ? <PowerOff size={14} /> : <Power size={14} />}
            {formData.isActive ? 'Деактивировать' : 'Активировать'}
          </button>

          <button
            onClick={handleSave}
            disabled={isBusy}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Сохранить
          </button>

          <ActionButton
            icon={<Trash2 size={18} />}
            onClick={handleDelete}
            disabled={isBusy}
            variant="delete"
            className="bg-white border-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
            activeTab === 'settings' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Settings size={14} />
          Настройки
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
            activeTab === 'history' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <History size={14} />
          История изменений
        </button>
        <div className="w-px h-3 bg-slate-100 mx-1" />
        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg">
          <button
            onClick={() => setCurrency('RUB')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all",
              currency === 'RUB' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            RUB
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all",
              currency === 'USD' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            USD
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div className="max-w-3xl">
          <ServiceHistory serviceId={service.id} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section: Main Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Информация об услуге</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Название услуги (для клиентов)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Например: Telegram Подписчики [Быстрые]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Основной тип ссылки (валидация)</label>
                    <select
                      value={formData.targetType}
                      onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                    >
                      {TARGET_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Дополнительные разрешенные типы (Опционально)</label>
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !formData.allowedTargetTypes.includes(val) && val !== formData.targetType) {
                          setFormData({ ...formData, allowedTargetTypes: [...formData.allowedTargetTypes, val] });
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="">-- Добавить еще один тип --</option>
                      {TARGET_TYPES.filter(t => t.value !== formData.targetType && !formData.allowedTargetTypes.includes(t.value)).map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>

                    {formData.allowedTargetTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.allowedTargetTypes.map(type => {
                          const label = TARGET_TYPES.find(t => t.value === type)?.label || type;
                          return (
                            <div key={type} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-semibold border border-indigo-100">
                              <span>{label}</span>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, allowedTargetTypes: formData.allowedTargetTypes.filter(t => t !== type) })}
                                className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider ml-1">Соцсеть / Платформа</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => {
                      const newPlatform = e.target.value as Platform;
                      setFormData({ ...formData, platform: newPlatform, categoryId: '' });
                    }}
                    className="w-full px-4 py-2.5 bg-indigo-50/30 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                  >
                    {Object.values(Platform).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider ml-1">Уровневая категория</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const catId = e.target.value;
                      const cat = allCategories.find(c => c.id === catId);
                      setFormData({
                        ...formData,
                        categoryId: catId,
                        category: cat?.categoryType || formData.category
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-indigo-50/30 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="">-- Выберите категорию --</option>
                    {filteredCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Описание услуги</label>
                  <button
                    onClick={handleMagicDescription}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    Улучшить через AI
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all leading-relaxed"
                  placeholder="Подробное описание услуги..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Критические требования (красная пометка)</label>
                <textarea
                  rows={2}
                  value={formData.requirements || ''}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-4 py-3 bg-rose-50 border border-rose-100 text-rose-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all leading-relaxed placeholder-rose-200"
                  placeholder="Например: Канал должен быть открытым..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Commercial Block */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Ценообразование</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Наценка %</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.markup}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        const newPrice = cost > 0 && m > 0 ? Number((cost * (1 + m / 100)).toFixed(2)) : formData.pricePer1000;
                        setFormData({ ...formData, markup: m, pricePer1000: newPrice });
                      }}
                      className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 text-indigo-700 rounded-xl text-lg font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all font-mono"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-200 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Цена продажи (за {unit === 1000 ? '1000 шт' : '1 шт'})</span>
                    <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Клиент видит эту цену</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.pricePer1000}
                      onChange={(e) => setFormData({ ...formData, pricePer1000: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl text-lg font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-mono"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                      {currency === 'RUB' ? '₽' : '$'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Закупка:</span>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-600 font-mono block italic">
                        {formatPrice(cost)}
                      </span>
                      {service.providerPriceOriginal && (
                        <span className="text-[9px] text-slate-400 font-mono italic">
                          ({service.providerPriceOriginal}{service.providerCurrencyOriginal === 'USD' ? '$' : service.providerCurrencyOriginal === 'EUR' ? '€' : ` ${service.providerCurrencyOriginal}`})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Профит:</span>
                    <span className={cn("text-xs font-black font-mono", profit > 0 ? "text-emerald-600" : "text-rose-600")}>
                      {profit > 0 ? '+' : ''}{formatPrice(profit)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase text-center block tracking-tight">Мин. кол-во</label>
                  <input
                    type="number"
                    value={formData.minQty}
                    onChange={(e) => setFormData({ ...formData, minQty: parseInt(e.target.value || '0') })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase text-center block tracking-tight">Макс. кол-во</label>
                  <input
                    type="number"
                    value={formData.maxQty}
                    onChange={(e) => setFormData({ ...formData, maxQty: parseInt(e.target.value || '0') })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase text-center block tracking-tight">Гарантия (дней)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.guaranteeDays ?? 0}
                    onChange={(e) => setFormData({ ...formData, guaranteeDays: parseInt(e.target.value || '0') })}
                    className="w-full px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-center text-indigo-700 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
              <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2">
                <Database size={14} className="animate-pulse" /> Подключения провайдеров
              </h4>
              <div className="space-y-4 relative z-10">
                {service.providerMappings && service.providerMappings.length > 0 ? (
                  service.providerMappings.map((m: any) => (
                    <div key={m.id} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/item">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-indigo-300">
                            {m.provider?.name || 'Unknown'}
                          </span>
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded-md",
                            m.priority === 1 ? "bg-indigo-500 text-white" : "bg-white/10 text-white/40"
                          )}>
                            P{m.priority}
                          </span>
                        </div>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                          m.isActive ? "bg-emerald-400 shadow-emerald-400/50" : "bg-slate-600"
                        )} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">Provider SKU:</span>
                        <span className="text-[11px] font-black text-white/80 font-mono tracking-tight">
                          {m.providerService?.id || m.providerServiceId}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <AlertTriangle className="mx-auto text-amber-500 mb-2" size={20} />
                    <p className="text-[10px] font-bold text-white/40 uppercase">Нет подключений</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Internal ID</span>
                  <span className="text-[11px] font-black text-indigo-300 font-mono">{service.id}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Orders</span>
                  <span className="text-[11px] font-black text-white">{service._count?.orders || 0}</span>
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
