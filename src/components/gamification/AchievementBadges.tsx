'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import type { AchievementType } from '@/generated/client';

interface Achievement {
    id: string;
    type: AchievementType;
    unlockedAt: Date;
    claimed: boolean;
    name: string;
    description: string;
    icon: string;
    reward: { type: string; value: number };
}

interface Props {
    achievements: Achievement[];
    onClaim: (achievementId: string) => Promise<void>;
}

export function AchievementBadges({ achievements, onClaim }: Props) {
    const [claiming, setClaiming] = React.useState<string | null>(null);

    const handleClaim = async (achievementId: string) => {
        setClaiming(achievementId);
        try {
            await onClaim(achievementId);
        } finally {
            setClaiming(null);
        }
    };

    if (achievements.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <span className="text-6xl mb-4 block">🏆</span>
                <p className="text-slate-500 font-medium">No achievements yet</p>
                <p className="text-slate-400 text-sm mt-1">Complete actions to unlock badges!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {achievements.map((achievement) => (
                <div
                    key={achievement.id}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${achievement.claimed
                        ? 'bg-slate-100 border-slate-200 opacity-75'
                        : 'bg-gradient-to-br from-white to-yellow-50 border-yellow-200 shadow-lg hover:shadow-xl'
                        }`}
                >
                    {/* Icon */}
                    <div className="text-5xl mb-3 text-center">{achievement.icon}</div>

                    {/* Name */}
                    <div className="text-center mb-2">
                        <h4 className="font-black text-sm uppercase tracking-wide text-slate-800">
                            {achievement.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">{achievement.description}</p>
                    </div>

                    {/* Reward */}
                    <div className="text-center text-xs font-bold text-emerald-600 mb-3">
                        {achievement.reward.type === 'BALANCE' && `+${achievement.reward.value}₽`}
                        {achievement.reward.type === 'DISCOUNT' && `${achievement.reward.value}% OFF`}
                        {achievement.reward.type === 'STATUS' && 'VIP Status'}
                    </div>

                    {/* Claim Button */}
                    {!achievement.claimed && (
                        <button
                            onClick={() => handleClaim(achievement.id)}
                            disabled={claiming === achievement.id}
                            className="w-full py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-xl font-black text-xs uppercase tracking-wider hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            {claiming === achievement.id ? 'Claiming...' : 'Claim'}
                        </button>
                    )}

                    {achievement.claimed && (
                        <div className="text-center text-xs text-slate-400 font-semibold">
                            ✓ Claimed
                        </div>
                    )}

                    {/* Unlock Date */}
                    <div className="text-center text-[10px] text-slate-400 mt-2">
                        {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                    </div>
                </div>
            ))}
        </div>
    );
}
