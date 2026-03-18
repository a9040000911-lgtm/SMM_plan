'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import {
    Trophy,
    Zap,
    Plus,
    Trash2,
    Settings
} from 'lucide-react';
import { updateLoyaltySettingsAction } from '@/app/admin/loyalty/actions';
import { useLanguage } from '@/providers/language-provider';

interface LoyaltyFormProps {
    initialLevels: any[];
    initialRules: any[];
}

export function LoyaltyForm({ initialLevels, initialRules }: LoyaltyFormProps) {
    const { t } = useLanguage();
    const lt = t.admin.loyalty;
    const [levels, setLevels] = useState(initialLevels);
    const [rules, setRules] = useState(initialRules);

    const addLevel = () => {
        setLevels([...levels, { name: 'NEW LEVEL', min: 0, discount: 0 }]);
    };

    const removeLevel = (index: number) => {
        setLevels(levels.filter((_, i) => i !== index));
    };

    const addRule = () => {
        setRules([...rules, {
            trigger: 'REGISTRATION',
            conditionValue: 0,
            rewardType: 'PROMO_ISSUE',
            rewardValue: 0,
            description: ''
        }]);
    };

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const handleSubmit = async (formData: FormData) => {
        const result = await updateLoyaltySettingsAction(formData);
        if (result.success) {
            alert('Settings updated');
        } else {
            alert('Error: ' + result.error);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-8">
            {/* SECTION: LOYALTY TIERS */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg">{lt.tiers_title}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{lt.tiers_subtitle}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={addLevel}
                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-200/50"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div className="p-8 space-y-4">
                    {levels.map((level, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl group transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lt.tier_name}</label>
                                <input
                                    name={`level_name_${idx}`}
                                    defaultValue={level.name}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                                />
                            </div>
                            <div className="w-full md:w-32 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lt.tier_min}</label>
                                <input
                                    name={`level_min_${idx}`}
                                    type="number"
                                    defaultValue={level.min}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                                />
                            </div>
                            <div className="w-full md:w-32 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lt.tier_discount}</label>
                                <input
                                    name={`level_discount_${idx}`}
                                    type="number"
                                    defaultValue={level.discount}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                                />
                            </div>
                            <div className="flex items-end pb-1 px-1">
                                <button
                                    type="button"
                                    onClick={() => removeLevel(idx)}
                                    className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <input type="hidden" name="levels_count" value={levels.length} />
                </div>
            </div>

            {/* SECTION: REWARD RULES */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg">{lt.automation_title}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{lt.automation_subtitle}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={addRule}
                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-200/50"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div className="p-8 space-y-4">
                    {rules.map((rule, idx) => (
                        <div key={idx} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded-md uppercase tracking-widest">Rule #{idx + 1}</span>
                                    <input
                                        name={`rule_description_${idx}`}
                                        defaultValue={rule.description}
                                        className="bg-transparent border-none font-bold text-slate-700 focus:ring-0 text-sm w-64"
                                        placeholder={lt.rule_placeholder}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeRule(idx)}
                                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lt.rule_trigger}</label>
                                    <select
                                        name={`rule_trigger_${idx}`}
                                        defaultValue={rule.trigger}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    >
                                        <option value="REGISTRATION">{lt.triggers.REGISTRATION}</option>
                                        <option value="DEPOSIT_GTE">{lt.triggers.DEPOSIT_GTE} </option>
                                        <option value="SPEND_GTE">{lt.triggers.SPEND_GTE} </option>
                                        <option value="ORDER_COUNT_GTE">{lt.triggers.ORDER_COUNT_GTE} </option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lt.rule_condition}</label>
                                    <input
                                        name={`rule_conditionValue_${idx}`}
                                        type="number"
                                        defaultValue={rule.conditionValue}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lt.rule_reward}</label>
                                    <select
                                        name={`rule_rewardType_${idx}`}
                                        defaultValue={rule.rewardType}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    >
                                        <option value="PROMO_ISSUE">{lt.rewards.PROMO_ISSUE}</option>
                                        <option value="BALANCE_ADD">{lt.rewards.BALANCE_ADD}</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lt.rule_value}</label>
                                    <input
                                        name={`rule_rewardValue_${idx}`}
                                        type="number"
                                        defaultValue={rule.rewardValue}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <input type="hidden" name="rules_count" value={rules.length} />
                </div>
            </div>

            {/* FOOTER ACTION */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-slate-900/40">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-800 text-blue-400 rounded-2xl border border-slate-700/50">
                        <Settings size={22} />
                    </div>
                    <div>
                        <h4 className="font-black text-white text-base">{lt.save}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{lt.save_desc}</p>
                    </div>
                </div>
                <button type="submit" className="flex items-center gap-2 px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                    <Plus size={20} />
                    <span className="uppercase tracking-widest text-xs">{lt.apply}</span>
                </button>
            </div>
        </form>
    );
}


