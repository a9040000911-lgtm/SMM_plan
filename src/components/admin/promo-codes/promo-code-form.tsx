'use client';
import React, { useState, useEffect } from 'react';
import { Tag, Percent, Plus, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/admin/ui';
import { createPromoCodeAction } from '@/app/admin/promo-codes/actions';
import { toast } from 'sonner';

interface PromoCodeFormProps {
    projects: any[];
    activeProjectId?: string | null;
    onSuccess: (newPromo: any) => void;
}

export function PromoCodeForm({ projects, activeProjectId, onSuccess }: PromoCodeFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newPercent, setNewPercent] = useState(10);
    const [newDesc, setNewDesc] = useState('');
    const [newProjectId, setNewProjectId] = useState(activeProjectId || projects[0]?.id || '');

    useEffect(() => {
        setNewProjectId(activeProjectId || projects[0]?.id || '');
    }, [activeProjectId, projects]);

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
                const projectRef = projects.find(p => p.id === newProjectId);
                onSuccess({ ...res.promo, project: projectRef });
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
    );
}
