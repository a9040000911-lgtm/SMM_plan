'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useTransition } from 'react';
import {
    Plus, Search, Edit2, Trash2, Globe, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';
import {
    createPlatformAction,
    updatePlatformAction,
    togglePlatformAction,
    deletePlatformAction,
    PlatformDTO
} from './platform-actions';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PlatformsManagerProps {
    platforms: any[];
}

export function PlatformsManager({ platforms }: PlatformsManagerProps) {
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<any>(null);

    const filtered = platforms.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        (p.nameRu && p.nameRu.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Поиск платформ..."
                        className="pl-9 pr-4 py-2 w-full rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus size={16} />
                    Добавить платформу
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(platform => (
                    <PlatformCard
                        key={platform.id}
                        platform={platform}
                        onEdit={() => setEditingPlatform(platform)}
                    />
                ))}
            </div>

            <PlatformModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                mode="create"
            />

            <PlatformModal
                isOpen={!!editingPlatform}
                onClose={() => setEditingPlatform(null)}
                mode="edit"
                initialData={editingPlatform}
            />
        </div>
    );
}

function PlatformCard({ platform, onEdit }: { platform: any, onEdit: () => void }) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        startTransition(async () => {
            const res = await togglePlatformAction(platform.id);
            if (res.success) {
                toast.success(`Платформа ${platform.isActive ? 'выключена' : 'включена'}`);
            } else {
                toast.error(res.error);
            }
        });
    };

    return (
        <div className={cn(
            "group relative bg-white border rounded-2xl p-5 hover:shadow-md transition-all",
            !platform.isActive && "opacity-60 border-dashed bg-slate-50"
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold uppercase",
                        platform.isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                    )}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {platform.icon ? <img src={platform.icon} alt="" className="w-6 h-6 object-contain" /> : (platform.slug?.[0] || '?')}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{platform.name}</h3>
                        <p className="text-xs text-slate-400 uppercase font-medium">ID: {platform.slug}</p>
                    </div>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={handleToggle}
                        disabled={isPending}
                        className={cn(
                            "w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                            platform.isActive ? "bg-blue-600" : "bg-slate-200"
                        )}
                    >
                        <span className={cn(
                            "block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out",
                            platform.isActive ? "translate-x-4" : "translate-x-0"
                        )} />
                    </button>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                {platform.nameRu && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Globe size={12} />
                        <span>RU: {platform.nameRu}</span>
                    </div>
                )}
                <div className="flex flex-wrap gap-1">
                    {platform.keywords?.slice(0, 3).map((k: string) => (
                        <div key={k} className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-500 rounded flex items-center">
                            {k}
                        </div>
                    ))}
                    {platform.keywords?.length > 3 && (
                        <span className="text-[10px] text-slate-400 pl-1">+{platform.keywords.length - 3}</span>
                    )}
                </div>
            </div>

            <button
                className="w-full py-2 px-4 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={onEdit}
            >
                <Edit2 size={12} />
                Редактировать
            </button>
        </div>
    );
}

function PlatformModal({
    isOpen,
    onClose,
    mode,
    initialData
}: {
    isOpen: boolean,
    onClose: () => void,
    mode: 'create' | 'edit',
    initialData?: PlatformDTO
}) {
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState<PlatformDTO>({
        slug: '',
        name: '',
        nameRu: '',
        keywords: [],
        isActive: true,
        ...initialData
    });

    React.useEffect(() => {
        if (isOpen && initialData) {
            setFormData({ ...initialData, keywords: initialData.keywords || [] });
        } else if (isOpen && mode === 'create') {
            setFormData({ slug: '', name: '', nameRu: '', keywords: [], isActive: true });
        }
    }, [isOpen, initialData, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            let res;
            if (mode === 'create') {
                res = await createPlatformAction(formData);
            } else {
                res = await updatePlatformAction(initialData!.id!, formData);
            }

            if (res.success) {
                toast.success(mode === 'create' ? 'Платформа создана' : 'Платформа обновлена');
                onClose();
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleDelete = async () => {
        if (!confirm('Вы уверены? Это действие нельзя отменить.')) return;
        startTransition(async () => {
            const res = await deletePlatformAction(initialData!.id!);
            if (res.success) {
                toast.success('Платформа удалена');
                onClose();
            } else {
                toast.error(res.error);
            }
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150]"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-[151] p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800">
                                    {mode === 'create' ? 'Новая платформа' : 'Редактировать платформу'}
                                </h2>
                                <button onClick={onClose} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-800 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Системный ID (Slug)</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        placeholder="telegram"
                                        disabled={mode === 'edit'}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400">Уникальный идентификатор, используется в API</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Название (EN)</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Telegram"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Название (RU)</label>
                                        <input
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            value={formData.nameRu || ''}
                                            onChange={e => setFormData({ ...formData, nameRu: e.target.value })}
                                            placeholder="Телеграм"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Ключевые слова (через запятую)</label>
                                    <input
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={formData.keywords.join(', ')}
                                        onChange={e => setFormData({ ...formData, keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        placeholder="tg, telegram, телега"
                                    />
                                    <p className="text-[10px] text-slate-400">Используются для авто-определения платформы при импорте</p>
                                </div>

                                <div className="flex justify-between items-center w-full pt-4 border-t border-slate-100 mt-4">
                                    {mode === 'edit' && (
                                        <button
                                            type="button"
                                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            onClick={handleDelete}
                                            disabled={isPending}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="ml-auto bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isPending && <Loader2 className="animate-spin" size={14} />}
                                        Сохранить
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
