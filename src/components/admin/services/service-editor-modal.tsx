'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import {
    X, Trash2, Check, Globe,
    AlertCircle, ExternalLink, ChevronDown, ChevronUp,
    Percent, Calculator, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { createManualServiceAction, updateManualServiceAction, upsertProjectOverrideAction, enhanceDescriptionAction } from '@/app/admin/services/actions';
import { Platform, Category } from '@/generated/client';
import { PLATFORM_LABELS, TARGET_TYPE_LABELS } from '@/services/providers/smart-analyzer.logic';

interface ServiceEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    service?: any; // Если редактируем
    providers: any[];
    allProviderServices: any[];
    categories: any[];
    activeProjectId?: string | null;
    onSuccess: () => void;
}



export function ServiceEditorModal({
    isOpen, onClose, service, providers, allProviderServices, categories, activeProjectId, onSuccess
}: ServiceEditorModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        requirements: '',
        pricePer1000: 0,
        minQty: 10,
        maxQty: 100000,
        platform: 'TELEGRAM' as Platform,
        category: 'SUBSCRIBERS' as Category,
        categoryId: '' as string,
        isPrivate: false,
        targetType: 'CHANNEL',
        mappings: [] as Array<{ providerId: string, providerServiceId: number, priority: number }>,
        markupMode: 'manual', // 'manual' | 'auto'
        baseMarkup: 0,
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const [useOverride, setUseOverride] = useState({
        name: false,
        description: false,
        requirements: false,
        price: false,
        minQty: false,
        maxQty: false
    });

    const isLocalMode = !!activeProjectId && activeProjectId !== 'all';

    // Determine current cost price based on Priority 1 mapping
    const getBestProviderPrice = () => {
        if (!formData.mappings || formData.mappings.length === 0) return 0;
        const sorted = [...formData.mappings].sort((a, b) => a.priority - b.priority);
        const best = sorted[0];
        const s = allProviderServices.find(service =>
            service.id === best.providerServiceId && service.providerId === best.providerId
        );
        return s ? Number(s.rawPrice) : 0;
    };

    const costPrice = getBestProviderPrice();

    useEffect(() => {
        if (service) {
            const meta = service.metadata || {};
            setFormData({
                id: service.id,
                name: service.name,
                description: service.description || '',
                requirements: service.requirements || '',
                pricePer1000: Number(service.pricePer1000),
                minQty: service.minQty,
                maxQty: service.maxQty,
                platform: service.platform,
                category: service.category,
                categoryId: service.categoryId || '',
                isPrivate: service.isPrivate || false,
                targetType: service.targetType || 'CHANNEL',
                mappings: service.providerMappings?.map((m: any) => ({
                    providerId: m.providerId,
                    providerServiceId: m.providerServiceId,
                    priority: m.priority
                })) || [],
                markupMode: meta.markupMode || 'manual',
                baseMarkup: meta.baseMarkup || 0
            });
        } else {
            // Reset for new
            setFormData({
                id: '',
                name: '',
                description: '',
                requirements: '',
                pricePer1000: 0,
                minQty: 10,
                maxQty: 100000,
                platform: 'TELEGRAM',
                category: 'SUBSCRIBERS',
                categoryId: '',
                isPrivate: false,
                targetType: 'CHANNEL',
                mappings: [],
                markupMode: 'manual',
                baseMarkup: 0
            });
        }
    }, [service, isOpen]);

    // Load project-specific overrides
    useEffect(() => {
        if (service && isLocalMode && isOpen) {
            const projectOverride = service.projectOverrides?.find((o: any) => o.projectId === activeProjectId);
            if (projectOverride) {
                setUseOverride({
                    name: !!projectOverride.customName,
                    description: !!projectOverride.customDescription,
                    requirements: !!projectOverride.customRequirements,
                    price: !!projectOverride.customPrice,
                    minQty: !!projectOverride.customMinQty,
                    maxQty: !!projectOverride.customMaxQty
                });
            } else {
                setUseOverride({
                    name: false, description: false, requirements: false,
                    price: false, minQty: false, maxQty: false
                });
            }
        }
    }, [service, activeProjectId, isOpen, isLocalMode]);

    // Auto-calculate price when Markup changes (in Auto mode)
    useEffect(() => {
        if (formData.markupMode === 'auto' && costPrice > 0) {
            const markup = formData.baseMarkup;
            const calculated = costPrice * (1 + markup / 100);
            const rounded = Math.ceil(calculated * 100) / 100; // Round UP to 2 decimals
            setFormData(prev => ({ ...prev, pricePer1000: rounded }));
        }
    }, [formData.markupMode, formData.baseMarkup, costPrice]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!formData.name || !formData.id) {
            toast.error('Заполните обязательные поля (Название, ID)');
            return;
        }

        setIsLoading(true);
        try {
            // Extract UI-only fields (markupMode, baseMarkup) to avoid sending them as top-level args to Prisma
            const { markupMode, baseMarkup, ...serviceData } = formData;

            const payload = {
                ...serviceData,
                mappings: serviceData.mappings.map(m => ({
                    ...m,
                    providerServiceId: String(m.providerServiceId)
                })),
                metadata: {
                    markupMode,
                    baseMarkup
                },
                categoryId: formData.categoryId || undefined,
                isPrivate: formData.isPrivate
            };

            let res;
            if (service) {
                res = await updateManualServiceAction(service.id, payload);

                // If local mode, also save the project overrides
                if (res.success && isLocalMode && activeProjectId) {
                    const overridePayload: any = {};
                    if (useOverride.name) overridePayload.customName = formData.name;
                    if (useOverride.description) overridePayload.customDescription = formData.description;
                    if (useOverride.requirements) overridePayload.customRequirements = formData.requirements;
                    if (useOverride.price) overridePayload.customPrice = formData.pricePer1000;
                    if (useOverride.minQty) overridePayload.customMinQty = formData.minQty;
                    if (useOverride.maxQty) overridePayload.customMaxQty = formData.maxQty;

                    // We also want to manage isActive somehow, but let's stick to these for now
                    await upsertProjectOverrideAction(service.id, activeProjectId, overridePayload);
                }
            } else {
                res = await createManualServiceAction(payload);
            }

            if (res.success) {
                toast.success(service ? 'Тариф обновлен' : 'Тариф создан');
                onSuccess();
                onClose();
            } else {
                toast.error('Ошибка: ' + res.error);
            }
        } catch (e: any) {
            toast.error('Ошибка: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMagicDescription = async () => {
        if (!service?.id) {
            toast.error('Сначала создайте и сохраните услугу, чтобы использовать AI');
            return;
        }
        setIsGenerating(true);
        try {
            const res = await enhanceDescriptionAction(service.id, formData.description);
            if (res.success && res.description) {
                setFormData(prev => ({ ...prev, description: res.description }));
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

    // Filter provider services based on selected platform (optional helper)
    const filteredProviderServices = allProviderServices.filter(s =>
        (s.platform === formData.platform || s.platform === 'OTHER')
    ).sort((a, b) => a.rawPrice - b.rawPrice);

    const profit = formData.pricePer1000 - costPrice;
    const margin = costPrice > 0 ? (profit / costPrice) * 100 : 100;

    const ContextToggle = ({ label, isOverridden, onToggle, isLocalMode }: any) => {
        if (!isLocalMode) return <label className="text-xs font-bold text-slate-700">{label}</label>;

        return (
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">{label}</label>
                <button
                    onClick={onToggle}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all ${isOverridden
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                >
                    {isOverridden ? (
                        <><Check size={10} /> Проектное</>
                    ) : (
                        <><Globe size={10} /> Глобальное</>
                    )}
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 my-auto border border-white/20 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">
                            {service ? 'Редактирование тарифа' : 'Новый тариф'}
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            {service ? `ID: ${service.id}` : 'Добавление в глобальный каталог тарифов'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={24} className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT: Main Info */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Basics */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Основная информация</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <ContextToggle
                                            label="Название"
                                            isLocalMode={isLocalMode}
                                            isOverridden={useOverride.name}
                                            onToggle={() => setUseOverride(prev => ({ ...prev, name: !prev.name }))}
                                        />
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className={`w-full px-4 py-3 border rounded-xl font-bold text-sm focus:ring-2 outline-none transition-all ${useOverride.name
                                                ? 'bg-blue-50 border-blue-200 ring-blue-500/10'
                                                : 'bg-slate-50 border-slate-200 ring-blue-500/20'
                                                }`}
                                            placeholder="Например: Instagram Followers (Fast)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Уникальный ID (Slug)</label>
                                        <input
                                            value={formData.id}
                                            disabled={!!service}
                                            onChange={e => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-600 focus:ring-2 ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                                            placeholder="inst_followers_fast"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Платформа</label>
                                        <select
                                            value={formData.platform}
                                            onChange={e => setFormData({ ...formData, platform: e.target.value as Platform, categoryId: '' })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase focus:ring-2 ring-blue-500/20 outline-none transition-all"
                                        >
                                            {Object.keys(Platform).map(p => (
                                                <option key={p} value={p}>{PLATFORM_LABELS?.[p as Platform] || p}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Категория (Группа)</label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={e => {
                                                const cat = categories.find(c => c.id === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    categoryId: e.target.value,
                                                    category: cat?.categoryType || cat?.category || formData.category,
                                                    targetType: cat?.targetType || formData.targetType
                                                });
                                            }}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase focus:ring-2 ring-blue-500/20 outline-none transition-all"
                                        >
                                            <option value="">Без категории</option>
                                            {categories.filter(c => c.platform === formData.platform).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 group flex items-center gap-2">
                                            Приватная
                                            <div className="relative inline-flex h-5 w-10 items-center rounded-full bg-slate-200 cursor-pointer transition-colors"
                                                onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}>
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.isPrivate ? 'translate-x-6 bg-blue-500' : 'translate-x-1'}`} />
                                            </div>
                                        </label>
                                        <select
                                            value={formData.targetType}
                                            onChange={e => setFormData({ ...formData, targetType: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase focus:ring-2 ring-blue-500/20 outline-none transition-all"
                                        >
                                            {Object.entries(TARGET_TYPE_LABELS).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing & Strategy - UPDATED */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Ценообразование</h3>

                                    <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${costPrice > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                                        <DollarSign size={14} />
                                        Закупка: <span className="font-mono text-sm">{costPrice > 0 ? costPrice : '—'} ₽</span>
                                    </div>
                                </div>

                                {/* Mode Switcher */}
                                <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, markupMode: 'manual' }))}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${formData.markupMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Ручная цена
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, markupMode: 'auto' }))}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${formData.markupMode === 'auto' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Calculator size={14} />
                                        Наценка %
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    {/* Markup Input (Auto Only) */}
                                    {formData.markupMode === 'auto' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-left-5">
                                            <label className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                                <Percent size={12} /> Наценка (%)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={formData.baseMarkup}
                                                    onChange={e => setFormData({ ...formData, baseMarkup: Number(e.target.value) })}
                                                    className="w-full pl-4 pr-10 py-3 bg-blue-50 border border-blue-100 rounded-xl font-black text-lg text-blue-700 focus:ring-2 ring-blue-500/20 outline-none transition-all"
                                                    placeholder="500"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 font-bold">%</div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-tight">
                                                Цена пересчитывается автоматически от себестоимости.
                                            </p>
                                        </div>
                                    )}

                                    {/* Final Price Input */}
                                    <div className="space-y-2 w-full">
                                        <ContextToggle
                                            label="Цена продажи за 1000 (₽)"
                                            isLocalMode={isLocalMode}
                                            isOverridden={useOverride.price}
                                            onToggle={() => setUseOverride(prev => ({ ...prev, price: !prev.price }))}
                                        />
                                        <input
                                            type="number"
                                            value={formData.pricePer1000}
                                            readOnly={formData.markupMode === 'auto'}
                                            onChange={e => {
                                                if (formData.markupMode === 'manual') {
                                                    setFormData({ ...formData, pricePer1000: Number(e.target.value) });
                                                }
                                            }}
                                            className={`w-full px-4 py-3 rounded-xl font-black text-lg outline-none transition-all ${useOverride.price
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : formData.markupMode === 'auto'
                                                    ? 'bg-slate-50 border border-slate-200 text-slate-500 cursor-lock'
                                                    : 'bg-emerald-50 border border-emerald-100 text-emerald-700 focus:ring-2 ring-emerald-500/20'
                                                }`}
                                        />
                                        <div className="flex items-center gap-3 text-[10px] font-mono font-bold pt-1">
                                            <span className={profit > 0 ? 'text-emerald-500' : 'text-red-500'}>
                                                Профит: {profit > 0 ? '+' : ''}{Math.round(profit * 100) / 100} ₽
                                            </span>
                                            <span className="text-slate-300">|</span>
                                            <span className={margin > 20 ? 'text-emerald-500' : 'text-amber-500'}>
                                                Наценка: {Math.round(margin)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Минимум</label>
                                        <input
                                            type="number"
                                            value={formData.minQty}
                                            onChange={e => setFormData({ ...formData, minQty: Number(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Максимум</label>
                                        <input
                                            type="number"
                                            value={formData.maxQty}
                                            onChange={e => setFormData({ ...formData, maxQty: Number(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Descriptions */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Описание</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-700">Публичное описание</label>
                                        <button
                                            onClick={handleMagicDescription}
                                            disabled={isGenerating || !service?.id}
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                                        >
                                            {isGenerating ? <div className="w-2 h-2 border border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Calculator size={10} />}
                                            AI-Генератор
                                        </button>
                                    </div>
                                    <textarea
                                        rows={6}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className={`w-full px-4 py-3 border rounded-xl font-medium text-sm outline-none transition-all resize-none ${useOverride.description
                                            ? 'bg-blue-50 border-blue-200 ring-blue-500/10'
                                            : 'bg-slate-50 border-slate-200 ring-blue-500/20'
                                            }`}
                                        placeholder="Описание тарифа..."
                                    />
                                </div>
                                <div className="space-y-3">
                                    <ContextToggle
                                        label="Технические требования"
                                        isLocalMode={isLocalMode}
                                        isOverridden={useOverride.requirements}
                                        onToggle={() => setUseOverride(prev => ({ ...prev, requirements: !prev.requirements }))}
                                    />
                                    <textarea
                                        rows={2}
                                        value={formData.requirements}
                                        onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                        className={`w-full px-4 py-3 border rounded-xl font-medium text-sm outline-none transition-all resize-none ${useOverride.requirements
                                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                                            : 'bg-amber-50 border-amber-100 text-amber-900 ring-amber-500/20'
                                            }`}
                                        placeholder="Например: профиль должен быть открыт..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Provider Mappings (Same as before) */}
                        <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col h-full shadow-xl">
                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                                <ExternalLink size={16} /> Потоки выполнения
                            </h3>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide mb-6 max-h-[400px]">
                                {formData.mappings.length === 0 ? (
                                    <div className="text-center p-8 border-2 border-dashed border-white/10 rounded-2xl">
                                        <AlertCircle className="mx-auto text-slate-600 mb-2" size={24} />
                                        <p className="text-xs text-slate-500 font-bold uppercase">Нет привязанных провайдеров</p>
                                    </div>
                                ) : (
                                    formData.mappings.sort((a, b) => a.priority - b.priority).map((map, idx) => {
                                        const prov = providers.find(p => p.id === map.providerId);
                                        const serv = allProviderServices.find(s => s.id === map.providerServiceId && s.providerId === map.providerId);
                                        return (
                                            <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl relative group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-black rounded uppercase">
                                                        Приоритет {map.priority}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const newM = formData.mappings.filter((_, i) => i !== idx);
                                                            setFormData(prev => ({ ...prev, mappings: newM }));
                                                        }}
                                                        className="text-slate-500 hover:text-rose-400 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="text-xs font-bold text-slate-200 mb-1">
                                                    {prov?.name || map.providerId}
                                                </div>
                                                <div className="text-[10px] text-slate-400 break-all leading-tight">
                                                    {serv ? `${serv.name} (${serv.rawPrice} ₽)` : `#${map.providerServiceId}`}
                                                </div>

                                                {/* Reorder */}
                                                <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded-lg p-1">
                                                    <button
                                                        onClick={() => {
                                                            if (map.priority > 1) {
                                                                const newM = [...formData.mappings];
                                                                newM[idx].priority--;
                                                                setFormData(prev => ({ ...prev, mappings: newM }));
                                                            }
                                                        }}
                                                        className="p-1 hover:text-white text-slate-400"
                                                    ><ChevronUp size={12} /></button>
                                                    <button
                                                        onClick={() => {
                                                            const newM = [...formData.mappings];
                                                            newM[idx].priority++;
                                                            setFormData(prev => ({ ...prev, mappings: newM }));
                                                        }}
                                                        className="p-1 hover:text-white text-slate-400"
                                                    ><ChevronDown size={12} /></button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/10">
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Добавить провайдера</label>
                                <select
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 outline-none focus:bg-white/10 transition-all font-mono"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) return;
                                        const [pid, serviceId] = val.split(':');

                                        if (formData.mappings.some(m => m.providerId === pid && m.providerServiceId === Number(serviceId))) {
                                            toast.error('Уже добавлен');
                                            return;
                                        }

                                        setFormData(prev => ({
                                            ...prev,
                                            mappings: [...prev.mappings, {
                                                providerId: pid,
                                                providerServiceId: Number(serviceId),
                                                priority: prev.mappings.length + 1
                                            }]
                                        }));
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Выберите тариф провайдера...</option>
                                    {filteredProviderServices.map(s => (
                                        <option key={`${s.providerId}:${s.id}`} value={`${s.providerId}:${s.id}`}>
                                            [{s.provider?.name || '?'}] #{s.id} - {s.name.substring(0, 40)}... ({s.rawPrice} ₽)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors">
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-wider hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? 'Сохранение...' : (service ? 'Сохранить изменения' : 'Создать тариф')}
                    </button>
                </div>

            </div>
        </div>
    );
}

