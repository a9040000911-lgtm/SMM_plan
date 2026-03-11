'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { AdminCard, Button, StatusBadge, ActionButton } from '@/components/admin/ui';
import { togglePromoCodeAction, deletePromoCodeAction, createPromoCodeAction } from './actions';
import { Copy, Trash2, Power, Plus, Tag, Percent, FileText, Loader2, X, Globe, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PromoCodesListProps {
    initialCodes: any[];
    projects: any[];
    activeProjectId?: string | null;
}

export function PromoCodesList({ initialCodes, projects, activeProjectId = null }: PromoCodesListProps) {
    const [codes, setCodes] = useState(initialCodes);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // FORM STATE
    const [newCode, setNewCode] = useState('');
    const [newPercent, setNewPercent] = useState(10);
    const [newDesc, setNewDesc] = useState('');
    const [newProjectId, setNewProjectId] = useState(activeProjectId || projects[0]?.id || '');

    // Reset newProjectId when activeProjectId changes
    React.useEffect(() => {
        if (!showCreateForm) {
            setNewProjectId(activeProjectId || projects[0]?.id || '');
        }
    }, [activeProjectId, projects, showCreateForm]);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Код ${code} скопирован!`);
    };

    const handleToggle = async (id: string) => {
        try {
            const res = await togglePromoCodeAction(id);
            if (res.success) {
                setCodes(codes.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
                toast.success('Статус обновлен');
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены? Если промокод использовался, он будет просто деактивирован.')) return;
        try {
            const res = await deletePromoCodeAction(id);
            if (res.success) {
                setCodes(codes.filter(c => c.id !== id));
                toast.success(res.message || 'Промокод удален');
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await createPromoCodeAction({
                code: newCode,
                discountPercent: newPercent,
                description: newDesc,
                projectId: newProjectId
            });

            if (res.success) {
                toast.success('Промокод создан');
                setCodes([{ ...res.promo, project: projects.find(p => p.id === newProjectId) }, ...codes]);
                setShowCreateForm(false);
                setNewCode('');
                setNewDesc('');
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* CONTEXT BANNER */}
            <div className={cn(
                "p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300",
                activeProjectId
                    ? "bg-blue-50/50 border-blue-100 shadow-sm shadow-blue-50"
                    : "bg-slate-50 border-slate-200"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-2.5 rounded-xl shadow-sm",
                        activeProjectId ? "bg-blue-600 text-white" : "bg-slate-800 text-white"
                    )}>
                        {activeProjectId ? <Briefcase size={20} /> : <Globe size={20} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-800 tracking-tight">
                                {activeProjectId
                                    ? `Контекст проекта: ${projects.find(p => p.id === activeProjectId)?.name}`
                                    : 'Глобальный режим'}
                            </h3>
                            <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                                activeProjectId
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-slate-200 text-slate-600 border-slate-300"
                            )}>
                                {activeProjectId ? 'PROJECT MODE' : 'GLOBAL MASTER'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {activeProjectId
                                ? 'Вы управляете промокодами только для этого проекта.'
                                : 'Внимание: В этом режиме отображаются все промокоды системы.'}
                        </p>
                    </div>
                </div>

                <Button
                    variant={showCreateForm ? 'outline' : 'primary'}
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 shrink-0"
                >
                    {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showCreateForm ? 'ОТМЕНА' : 'СОЗДАТЬ ПРОМОКОД'}
                </Button>
            </div>

            {/* CREATE FORM */}
            {showCreateForm && (
                <AdminCard title="Новый промокод">
                    <form onSubmit={handleCreate} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 col-span-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 pl-1">КОД</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-black uppercase"
                                    placeholder="SAVE30"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 col-span-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 pl-1">СКИДКА %</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="99"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-black"
                                    value={newPercent}
                                    onChange={(e) => setNewPercent(parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 col-span-1 md:col-span-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 pl-1">ПРОЕКТ</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                                value={newProjectId}
                                onChange={(e) => setNewProjectId(e.target.value)}
                            >
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-1">
                            <Button disabled={submitting} className="w-full">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                СОЗДАТЬ
                            </Button>
                        </div>

                        <div className="space-y-2 col-span-1 md:col-span-4 mt-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 pl-1">ОПИСАНИЕ (ОПЦИОНАЛЬНО)</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                    rows={2}
                                    placeholder="Например: Для компенсации задержки..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                />
                            </div>
                        </div>
                    </form>
                </AdminCard>
            )}

            {/* LIST TABLE */}
            <AdminCard title="Список промокодов">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Код</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Скидка</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Проект</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Описание</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Статус</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {codes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic font-medium">
                                        Промокоды не найдены
                                    </td>
                                </tr>
                            ) : (
                                codes.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-800 tracking-tight uppercase bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                                    {promo.code}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(promo.code)}
                                                    className="text-slate-300 hover:text-blue-500 transition-colors p-1"
                                                    title="Скопировать"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 font-black text-emerald-600">
                                                <Percent className="w-3 h-3" />
                                                {promo.discountPercent}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {promo.project ? (
                                                <span
                                                    className="px-2 py-0.5 rounded text-[10px] font-black uppercase border"
                                                    style={{
                                                        backgroundColor: `${promo.project.brandColor}15`,
                                                        color: promo.project.brandColor,
                                                        borderColor: `${promo.project.brandColor}30`
                                                    }}
                                                >
                                                    {promo.project.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold italic">Global</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500 font-medium truncate max-w-[200px] block" title={promo.description}>
                                                {promo.description || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge isActive={promo.isActive} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ActionButton
                                                    icon={<Power className="w-4 h-4" />}
                                                    title={promo.isActive ? 'Деактивировать' : 'Активировать'}
                                                    onClick={() => handleToggle(promo.id)}
                                                    variant={promo.isActive ? 'default' : 'view'}
                                                />
                                                <ActionButton
                                                    icon={<Trash2 className="w-4 h-4" />}
                                                    title="Удалить"
                                                    onClick={() => handleDelete(promo.id)}
                                                    variant="delete"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </AdminCard>
        </div>
    );
}
