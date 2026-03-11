'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button } from '@/components/admin/ui';
import { BotModule } from '@/services/ai/bot-module.generator';
import { Save, RefreshCw, Wand2, Check } from 'lucide-react';
import { sanitizeHtml } from '@/utils/sanitizer';
import { generateFunnelAction, saveBotModulesAction } from '@/app/admin/projects/[id]/actions';
import { Tone } from '@/services/ai/bot-module.generator';

interface Props {
    projectId: string;
    initialModules: BotModule[];
}

export function ProjectMarketingEditor({ projectId, initialModules }: Props) {
    const [tone, setTone] = useState<string>('PROFESSIONAL');
    const [modules, setModules] = useState<BotModule[]>(initialModules || []);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleRegenerate = async () => {
        setIsLoading(true);
        try {
            const newModules = await generateFunnelAction(projectId, tone as Tone);
            setModules(newModules);
            setIsSaved(false); // New content needs saving
        } catch (e) {
            console.error(e);
            alert('Failed to generate funnel. Check console.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveBotModulesAction(projectId, modules);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (_e) {
            alert('Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-black text-slate-800">Marketing Funnel</h3>
                    <p className="text-sm text-slate-500">Configure how the bot welcomes and sells to users.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleRegenerate} disabled={isLoading} className="gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200" variant="outline">
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Generate New
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className={`gap-2 ${isSaved ? 'bg-green-600' : 'bg-slate-900'} text-white`}>
                        {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaved ? 'Saved!' : 'Save Funnel'}
                    </Button>
                </div>
            </div>

            {/* Tone Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['PROFESSIONAL', 'FRIENDLY', 'AGGRESSIVE', 'MINIMALIST'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTone(t)}
                        disabled={isLoading}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${tone === t
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                            }`}
                    >
                        <div className="font-extrabold text-xs uppercase tracking-wider mb-1">{t}</div>
                        <div className="text-[10px] opacity-70">
                            {t === 'PROFESSIONAL' && 'Trust & Authority'}
                            {t === 'FRIENDLY' && 'Casual & Fun'}
                            {t === 'AGGRESSIVE' && 'FOMO & Hype'}
                            {t === 'MINIMALIST' && 'Just Facts'}
                        </div>
                    </button>
                ))}
            </div>

            {/* Funnel Preview */}
            <div className="space-y-4">
                {(modules.length > 0 ? modules : [
                    { type: 'AWARENESS', content: 'Generating preview...' },
                    { type: 'INTEREST', content: '...' },
                    { type: 'DESIRE', content: '...' },
                    { type: 'ACTION', content: '...' }
                ]).map((module: any, idx) => (
                    <div key={idx} className="flex gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {idx + 1}
                        </div>
                        <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200 group-hover:border-indigo-200 transition-colors shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                    {module.type}
                                </span>
                            </div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(module.content) }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
