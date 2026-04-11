'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { AdminCard, Button, StatusBadge, ActionButton } from '@/components/admin/ui';
import { togglePromoCodeAction, deletePromoCodeAction } from './actions';
import { Copy, Trash2, Power, Plus, Ticket, X, Globe, Briefcase, Percent } from 'lucide-react';
import { PromoCodeForm } from '@/components/admin/promo-codes/promo-code-form';
import { toast } from 'sonner';
import { cn } from '@/utils/ui';
import { AdminTableCard } from '@/components/admin/core/admin-table-card';

interface PromoCodesListProps {
    initialCodes: any[];
    projects: any[];
    activeProjectId?: string | null;
}

export function PromoCodesList({ initialCodes, projects, activeProjectId = null }: PromoCodesListProps) {
    const [codes, setCodes] = useState(initialCodes);
    const [showCreateForm, setShowCreateForm] = useState(false);

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
                    <PromoCodeForm 
                        projects={projects} 
                        activeProjectId={activeProjectId} 
                        onSuccess={(newPromo) => {
                            setCodes([newPromo, ...codes]);
                            setShowCreateForm(false);
                        }}
                    />
                </AdminCard>
            )}

            {/* LIST TABLE */}
            <AdminTableCard title="Список промокодов" icon={Ticket}>
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
            </AdminTableCard>
        </div>
    );
}


