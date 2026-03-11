'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Save, Globe, Tag, Layers, FileText, Info } from 'lucide-react';
import { createService } from '@/app/admin/services/actions';
import { InfoTooltip } from '@/components/admin/core/info-tooltip';
import { ServiceSelector } from '@/components/admin/services/service-selector';

const PLATFORMS = ['TELEGRAM', 'INSTAGRAM', 'VK', 'TIKTOK', 'YOUTUBE', 'TWITCH', 'WHATSAPP', 'SPOTIFY', 'SOUNDCLOUD', 'LINKEDIN', 'PINTEREST', 'SNAPCHAT', 'TROVO', 'KWAI', 'MESSENGER_MAX', 'OTHER'];
const CATEGORIES = ['SUBSCRIBERS', 'LIKES', 'VIEWS', 'REACTIONS', 'REPOSTS', 'COMMENTS', 'TRAFFIC', 'DISLIKES', 'OTHER'];

const TARGET_TYPES = [
    { value: 'CHANNEL', label: 'Канал / Группа / Сообщество (Подписчики)' },
    { value: 'POST', label: 'Пост / Публикация (Лайки, Репосты)' },
    { value: 'PROFILE', label: 'Профиль пользователя' },
    { value: 'VIDEO', label: 'Видео / Shorts / Reel / Клип' },
    { value: 'PHOTO', label: 'Фотография / Альбом' },
    { value: 'CHANNEL_POSTS', label: 'Авто-просмотры (Ссылка на канал)' },
    { value: 'STORY', label: 'Stories' },
    { value: 'COMMENTS', label: 'Комментарии (Ссылка на пост)' },
    { value: 'MARKET', label: 'Товар / Маркет' },
    { value: 'PLAYLIST', label: 'Плейлист (Музыка)' },
    { value: 'ALBUM', label: 'Альбом (Фото/Музыка)' },
    { value: 'POLL', label: 'Опросы / Голосования' },
    { value: 'EXTERNAL', label: 'Внешний сайт (Трафик)' },
    { value: 'CUSTOM', label: 'Универсальный (Любая ссылка)' }
];

export function NewServiceForm({
    providers,
    availableServices
}: {
    providers: any[],
    availableServices: any[]
}) {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        pricePer1000: '',
        platform: 'TELEGRAM',
        category: 'SUBSCRIBERS',
        targetType: 'CHANNEL',
        allowedTargetTypes: [] as string[],
        minQty: 10,
        maxQty: 100000
    });

    const handleServiceSelect = (service: any) => {
        // Умное автозаполнение
        const name = service.name;

        // Пытаемся угадать платформу и категорию по названию
        let platform = formData.platform;
        let category = formData.category;

        const lowerName = name.toLowerCase();
        if (lowerName.includes('telegram') || lowerName.includes('тг')) platform = 'TELEGRAM';
        else if (lowerName.includes('instagram') || lowerName.includes('инста')) platform = 'INSTAGRAM';
        else if (lowerName.includes('vk') || lowerName.includes('вк')) platform = 'VK';
        else if (lowerName.includes('tiktok') || lowerName.includes('тик')) platform = 'TIKTOK';

        if (lowerName.includes('подписчик') || lowerName.includes('sub')) category = 'SUBSCRIBERS';
        else if (lowerName.includes('лайк') || lowerName.includes('like')) category = 'LIKES';
        else if (lowerName.includes('просмотр') || lowerName.includes('view')) category = 'VIEWS';
        else if (lowerName.includes('реакц') || lowerName.includes('reaction')) category = 'REACTIONS';

        // Рассчитываем рекомендуемую цену (закупка * 7)
        const recommendedPrice = (service.rawPrice * 7).toFixed(2);

        setFormData(prev => ({
            ...prev,
            name: name,
            pricePer1000: recommendedPrice,
            platform,
            category,
            // Генерируем ID если он пустой
            id: prev.id || name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form action={createService} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                        <Layers className="text-blue-500" size={20} />
                        <h3 className="font-bold text-slate-800 uppercase tracking-tighter">Core Configuration</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center">
                                System Blueprint ID
                                <InfoTooltip text="Уникальный код для БД. Например: tg_subs_fast" />
                            </label>
                            <input
                                name="id"
                                type="text"
                                required
                                value={formData.id}
                                onChange={handleChange}
                                placeholder="tg_subs_1"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center">
                                Public Label
                            </label>
                            <input
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Подписчики (Быстрые)"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center">
                            <FileText size={14} className="mr-2" /> Service Specs
                        </label>
                        <textarea
                            name="description"
                            required
                            rows={12}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Скорость: 10к/день. Качество: Реальные пользователи..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed min-h-[300px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                <Globe size={12} className="mr-2" /> Platform
                            </label>
                            <select
                                name="platform"
                                value={formData.platform}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                            >
                                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                <Tag size={12} className="mr-2" /> Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <ServiceSelector
                    providers={providers}
                    availableServices={availableServices}
                    onSelect={handleServiceSelect}
                />
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-blue-600 flex items-center">
                            Trigger Type (Link)
                        </label>
                        <select
                            name="targetType"
                            value={formData.targetType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 outline-none"
                        >
                            {TARGET_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center">
                            Extra Trigger Types
                        </label>
                        <select
                            value=""
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val && !formData.allowedTargetTypes.includes(val) && val !== formData.targetType) {
                                    setFormData({ ...formData, allowedTargetTypes: [...formData.allowedTargetTypes, val] });
                                }
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        >
                            <option value="">-- Add another type --</option>
                            {TARGET_TYPES.filter(t => t.value !== formData.targetType && !formData.allowedTargetTypes.includes(t.value)).map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        {formData.allowedTargetTypes.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {formData.allowedTargetTypes.map(type => {
                                    const label = TARGET_TYPES.find(t => t.value === type)?.label || type;
                                    return (
                                        <div key={type} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold border border-blue-100 uppercase">
                                            <span>{label}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, allowedTargetTypes: formData.allowedTargetTypes.filter(t => t !== type) })}
                                                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Min Qty</label>
                            <input
                                name="minQty"
                                type="number"
                                value={formData.minQty}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Max Qty</label>
                            <input
                                name="maxQty"
                                type="number"
                                value={formData.maxQty}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center">
                            Retail Price (per 1000)
                        </label>
                        <div className="relative">
                            <input
                                name="pricePer1000"
                                type="number"
                                step="0.01"
                                required
                                value={formData.pricePer1000}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black text-emerald-600 outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₽</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 italic pl-1">
                            * Рекомендуемая наценка x7 от закупки
                        </p>
                    </div>

                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all flex items-center justify-center gap-3">
                        <Save size={20} />
                        Commit Service
                    </button>

                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
                        <Info className="text-blue-500 shrink-0" size={18} />
                        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                            После нажатия кнопки сервис будет мгновенно доступен в приложении и привязан к выбранному API провайдера.
                        </p>
                    </div>
                </div>
            </div>
        </form>
    );
}
