'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import {
    Plus, Search, Edit2, Trash2,
    Layers, Zap,
    ChevronDown, ChevronUp, ExternalLink, Globe, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { IconPicker, getLucideIcon } from '@/components/admin/core/icon-picker';
import {
    upsertServiceCategoryAction,
    deleteServiceCategoryAction
} from '@/app/admin/services/actions';
import { CATEGORY_DISPLAY_NAMES, CATEGORY_ICONS as CATEGORY_ICON_NAMES } from '@/utils/category-metadata';
import { toast } from 'sonner';
import { cn } from '@/utils/ui';
import { Platform, Category } from '@prisma/client';

interface CategoryManagerProps {
    initialCategories: any[];
    platforms: string[];
    projects: any[];
    activeProjectId: string | null;
}

// Map string icon names to Lucide components
const CATEGORY_ICONS: Record<string, any> = Object.fromEntries(
    Object.entries(CATEGORY_ICON_NAMES).map(([key, name]) => [key, getLucideIcon(name as string) || Layers])
);

const PLATFORM_NAMES: Record<string, string> = {
    'TELEGRAM': 'Telegram',
    'INSTAGRAM': 'Instagram',
    'VK': 'ВКонтакте',
    'TIKTOK': 'TikTok',
    'YOUTUBE': 'YouTube',
    'FACEBOOK': 'Facebook',
    'TWITTER': 'Twitter',
    'DISCORD': 'Discord',
    'THREADS': 'Threads',
    'REDDIT': 'Reddit',
    'TWITCH': 'Twitch',
    'KICK': 'Kick',
    'RUTUBE': 'RuTube',
    'DZEN': 'Дзен',
    'MUSIC': 'Музыка',
    'OK': 'Одноклассники',
    'LIKEE': 'Likee',
    'WHATSAPP': 'WhatsApp',
    'SPOTIFY': 'Spotify',
    'SOUNDCLOUD': 'SoundCloud',
    'LINKEDIN': 'LinkedIn',
    'PINTEREST': 'Pinterest',
    'SNAPCHAT': 'Snapchat',
    'TROVO': 'Trovo',
    'KWAI': 'Kwai',
    'GOOGLE': 'Google',
    'APPLE': 'Apple',
    'YANDEX': 'Яндекс',
    'STEAM': 'Steam',
    'RUMBLE': 'Rumble',
    'TUMBLR': 'Tumblr',
    'VIMEO': 'Vimeo',
    'SHAZAM': 'Shazam',
    'QUORA': 'Quora',
    'MEDIUM': 'Medium',
    'WEBSITE': 'Сайт',
    'OTHER': 'Прочее'
};

const CATEGORY_TYPE_NAMES = CATEGORY_DISPLAY_NAMES;

export function CategoryManager({
    initialCategories,
    platforms,
    projects,
    activeProjectId
}: CategoryManagerProps) {
    const [categories, setCategories] = useState(
        initialCategories.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [expandedPlatforms, setExpandedPlatforms] = useState<string[]>(platforms);

    // Form state for auto-sync
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [categoryType, setCategoryType] = useState<Category>('OTHER');
    const [icon, setIcon] = useState('layers');
    const [priority, setPriority] = useState(0);

    // Reset/Sync state when modal opens or editing target changes
    React.useEffect(() => {
        if (isModalOpen) {
            setName(editingCategory?.name || '');
            setSlug(editingCategory?.slug || '');
            setCategoryType(editingCategory?.categoryType || 'OTHER');
            setIcon(editingCategory?.icon || 'layers');
            setPriority(editingCategory?.priority || 0);
        }
    }, [isModalOpen, editingCategory]);

    const handleCategoryTypeChange = (newType: Category) => {
        setCategoryType(newType);

        const currentName = name.trim();
        const isDefaultOrEmpty = !currentName || Object.values(CATEGORY_TYPE_NAMES).includes(currentName);

        if (isDefaultOrEmpty) {
            const newName = CATEGORY_TYPE_NAMES[newType] || '';
            setName(newName);

            // Auto-update slug if it was also default/empty
            if (!slug || slug === editingCategory?.slug) {
                const newSlug = newType.toLowerCase().replace(/_/g, '-');
                setSlug(newSlug);
            }
        }
    };

    const filteredCategories = React.useMemo(() => categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.platform.toLowerCase().includes(searchQuery.toLowerCase())
    ), [categories, searchQuery]);

    const categoriesByPlatform = React.useMemo(() => platforms.reduce((acc, platform) => {
        const platformCats = filteredCategories.filter(c => c.platform === platform);
        if (platformCats.length > 0) acc[platform] = platformCats;
        return acc;
    }, {} as Record<string, any[]>), [filteredCategories, platforms]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: name,
            platform: formData.get('platform') as Platform,
            categoryType: categoryType,
            description: formData.get('description') as string,
            priority: parseInt(formData.get('priority') as string) || 0,
            projectId: activeProjectId || undefined,
            icon: formData.get('icon') as string,
            slug: slug || undefined
        };

        try {
            const result = await upsertServiceCategoryAction(editingCategory?.id, data);
            if (result) {
                toast.success(editingCategory ? 'Категория обновлена' : 'Категория создана');
                setIsModalOpen(false);
                setEditingCategory(null);
                window.location.reload();
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены? Это действие нельзя отменить.')) return;
        const result = await deleteServiceCategoryAction(id);
        if (result.success) {
            toast.success('Удалено успешно');
            setCategories(categories.filter(c => c.id !== id));
        } else {
            toast.error(result.error);
        }
    };

    const togglePlatform = (p: string) => {
        setExpandedPlatforms(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
        );
    };

    return (
        <div className="space-y-8">
            {/* Context Banner */}
            <div className={cn(
                "p-4 rounded-3xl border flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500",
                !activeProjectId
                    ? "bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-200"
                    : "bg-blue-50 border-blue-100 text-blue-700 shadow-xl shadow-blue-100/50"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                        !activeProjectId ? "bg-slate-800" : "bg-blue-600 text-white"
                    )}>
                        {!activeProjectId ? <Globe size={24} /> : <Briefcase size={24} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight leading-none italic">
                            {!activeProjectId ? 'Режим: Глобальный Мастер' : `Проект: ${projects.find(p => p.id === activeProjectId)?.name || 'Контекст проекта'}`}
                        </h3>
                        <p className={cn(
                            "text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60",
                            !activeProjectId ? "text-slate-400" : "text-blue-500"
                        )}>
                            {!activeProjectId
                                ? 'Вы редактируете базовые категории для всех сайтов'
                                : 'Вы настраиваете платформы и категории для конкретного домена'}
                        </p>
                    </div>
                </div>

                {!activeProjectId && (
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Подсказка:</span>
                        <span className="text-[10px] font-bold text-slate-300 italic">Изменения здесь затронут все проекты сразу</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Найти категорию..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                    <Plus size={20} />
                    Создать категорию
                </button>
            </div>

            <div className="space-y-6">
                {Object.entries(categoriesByPlatform).map(([platform, platformCats]) => (
                    <div key={platform} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={() => togglePlatform(platform)}
                            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors border-b border-slate-50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-inner">
                                    <span className="text-[10px] font-black tracking-tighter uppercase">{platform.substring(0, 3)}</span>
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-black text-slate-900">{PLATFORM_NAMES[platform] || platform}</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{platformCats.length} элементов</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                {expandedPlatforms.includes(platform) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </button>

                        <div className={cn(
                            "transition-all duration-300 ease-in-out",
                            expandedPlatforms.includes(platform) ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                        )}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-slate-50/30">
                                {platformCats.map(cat => {
                                    const Icon = cat.icon ? getLucideIcon(cat.icon) : (CATEGORY_ICONS[cat.categoryType] || Layers);
                                    return (
                                        <div key={cat.id} className="group p-6 bg-white rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all relative flex flex-col h-full">
                                            <div className="flex items-start justify-between flex-1">
                                                <Link
                                                    href={`/admin/services?platform=${cat.platform}&category=${cat.categoryType}`}
                                                    className="flex items-center gap-4 flex-1 group/link"
                                                >
                                                    <div className="relative w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm group-hover/link:text-blue-600 group-hover/link:bg-blue-50 group-hover/link:border-blue-100 transition-all">
                                                        <Icon size={28} />
                                                        <div className={cn(
                                                            "absolute -top-2 -right-2 px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tighter border shadow-sm",
                                                            !cat.projectId
                                                                ? "bg-slate-900 border-slate-800 text-white"
                                                                : "bg-blue-600 border-blue-500 text-white"
                                                        )}>
                                                            {!cat.projectId ? 'Global' : 'Project'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-900 text-lg leading-tight group-hover/link:text-blue-600 transition-colors">
                                                            {cat.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                                {CATEGORY_TYPE_NAMES[cat.categoryType] || cat.categoryType}
                                                            </span>
                                                            {cat.slug && (
                                                                <span className="text-[10px] text-slate-400 font-medium">/{cat.slug}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div className="flex flex-col gap-1 ml-4">
                                                    <button
                                                        onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                                                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title={!cat.projectId && activeProjectId ? "Создать override для проекта" : "Редактировать"}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cat.id)}
                                                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    {cat.projectId ? (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase">
                                                            <Zap size={10} />
                                                            Override
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <Layers size={14} className="opacity-50" />
                                                            <span className="text-[11px] font-bold uppercase tracking-wider">Приоритет: {cat.priority}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <Link
                                                    href={`/admin/services?platform=${cat.platform}&category=${cat.categoryType}`}
                                                    className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all group/btn"
                                                >
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[11px] font-black">{cat._count?.internalServices || 0} услуг</span>
                                                        <span className="text-[8px] font-bold uppercase tracking-tighter opacity-70 group-hover/btn:opacity-100">Открыть список</span>
                                                    </div>
                                                    <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-[2rem] shadow-2xl border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                        <Layers size={18} />
                                    </div>
                                    {editingCategory
                                        ? (editingCategory.projectId === null && activeProjectId ? 'Создать Override' : 'Редактировать')
                                        : 'Новая категория'}
                                </h2>
                                <p className="text-[11px] text-slate-400 font-bold mt-1 ml-12 uppercase tracking-wider">
                                    {editingCategory?.projectId === null && activeProjectId
                                        ? 'Вы создаете копию глобальной категории для этого проекта'
                                        : 'Настройка группы услуг'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all active:scale-90">
                                <Plus className="rotate-45" size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col min-h-0">
                            <div className="p-8 space-y-6 overflow-y-auto modern-scrollbar">
                                {editingCategory?.projectId === null && activeProjectId && (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                                        <Zap className="text-amber-500 shrink-0" size={18} />
                                        <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                                            <b>Внимание:</b> Эта категория является Глобальной. Сохранение изменений создаст ПЕРСОНАЛЬНУЮ копию для текущего проекта. Глобальная версия останется нетронутой.
                                        </p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Название категории</label>
                                        <input
                                            name="name"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm"
                                            placeholder="Напр: Живые подписчики"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Slug (Часть URL)</label>
                                        <input
                                            name="slug"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm"
                                            placeholder="real-subscribers"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Социальная сеть</label>
                                        <select
                                            name="platform"
                                            defaultValue={editingCategory?.platform || 'TELEGRAM'}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                                        >
                                            {Object.entries(PLATFORM_NAMES).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Тип услуг</label>
                                        <select
                                            name="categoryType"
                                            value={categoryType}
                                            onChange={(e) => handleCategoryTypeChange(e.target.value as Category)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                                        >
                                            {Object.entries(CATEGORY_TYPE_NAMES).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Иконка (Lucide)</label>
                                        <IconPicker
                                            value={icon}
                                            onChange={setIcon}
                                        />
                                        <input type="hidden" name="icon" value={icon} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Приоритет</label>
                                        <input
                                            name="priority"
                                            type="number"
                                            value={priority}
                                            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-center text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Описание (Видно клиентам)</label>
                                    <textarea
                                        name="description"
                                        defaultValue={editingCategory?.description}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm resize-none"
                                        placeholder="Введите описание категории..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-slate-100 p-8 -m-8 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-5 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 uppercase tracking-widest text-[10px]"
                                    >
                                        {editingCategory ? 'Сохранить изменения' : 'Создать категорию'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}



