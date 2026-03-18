'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button } from '@/components/admin/ui';
import { Save, Swords, Trophy, Crown, Check } from 'lucide-react';
import { updateProjectConfigAction } from '@/app/admin/projects/[id]/actions';
import { useLanguage } from '@/providers/language-provider';

interface Props {
    projectId: string;
    initialScheme: 'CLASSIC' | 'GAMIFIED' | 'VIP';
}

export function ProjectLoyaltyEditor({ projectId, initialScheme }: Props) {
    const { t } = useLanguage();
    const pt = t.admin.projects;
    const [scheme, setScheme] = useState<string>(initialScheme || 'CLASSIC');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProjectConfigAction(projectId, { loyaltyScheme: scheme });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (_e) {
            alert(t.tma.attention || 'Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-black text-slate-800">{pt.loyalty_scheme}</h3>
                    <p className="text-sm text-slate-500">{pt.loyalty_desc}</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className={`gap-2 ${isSaved ? 'bg-green-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaving ? pt.saving : (isSaved ? pt.saved : pt.save_config)}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CLASSIC */}
                <div
                    onClick={() => setScheme('CLASSIC')}
                    className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-xl ${scheme === 'CLASSIC' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-100 bg-white'
                        }`}
                >
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-md flex items-center justify-center mb-4">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-slate-800 uppercase text-sm">{pt.classic}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {pt.classic_desc}
                    </p>
                    <div className="mt-4 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pt.rewards}</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-amber-700"></span> Bronze (0%)
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Silver (3%)
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Gold (7%)
                        </div>
                    </div>
                </div>

                {/* GAMIFIED */}
                <div
                    onClick={() => setScheme('GAMIFIED')}
                    className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-xl ${scheme === 'GAMIFIED' ? 'border-violet-500 bg-violet-50/50' : 'border-slate-100 bg-white'
                        }`}
                >
                    <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-md flex items-center justify-center mb-4">
                        <Swords className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-slate-800 uppercase text-sm">{pt.gamified}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {pt.gamified_desc}
                    </p>
                    <div className="mt-4 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pt.mechanics}</div>
                        <div className="text-xs font-bold text-slate-600">{pt.xp_formula}</div>
                        <div className="text-xs font-bold text-slate-600">{pt.level_threshold}</div>
                        <div className="text-xs font-bold text-violet-600">{pt.level_discount}</div>
                    </div>
                </div>

                {/* VIP */}
                <div
                    onClick={() => setScheme('VIP')}
                    className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-xl ${scheme === 'VIP' ? 'border-slate-900 bg-slate-50' : 'border-slate-100 bg-white'
                        }`}
                >
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-md flex items-center justify-center mb-4">
                        <Crown className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-slate-800 uppercase text-sm">{pt.vip}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {pt.vip_desc}
                    </p>
                    <div className="mt-4 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pt.rules}</div>
                        <div className="text-xs font-bold text-slate-600">{pt.vip_entry}</div>
                        <div className="text-xs font-bold text-rose-500 font-black">{pt.vip_discount}</div>
                        <div className="text-xs font-bold text-slate-400">{pt.vip_below}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}


