'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { AchievementBadges } from '@/components/gamification/AchievementBadges';

interface AchievementsTabProps {
    userId: string;
}

export function AchievementsTab({ userId }: AchievementsTabProps) {
    const [achievements, setAchievements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAchievements();
    }, [userId]);

    const fetchAchievements = async () => {
        try {
            const response = await fetch('/api/client/achievements');
            if (response.ok) {
                const data = await response.json();
                setAchievements(data.achievements || []);
            }
        } catch (error) {
            console.error('Failed to fetch achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (achievementId: string) => {
        try {
            const response = await fetch('/api/client/achievements/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ achievementId })
            });

            if (response.ok) {
                // Refresh achievements list
                await fetchAchievements();
            } else {
                alert('Failed to claim reward');
            }
        } catch (error) {
            console.error('Claim error:', error);
            alert('Failed to claim reward');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="animate-spin text-primary opacity-20" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-10 pt-6">
            {/* Header */}
            <div className="text-center space-y-3">
                <h2 className="text-4xl font-black text-[#171717] tracking-tight uppercase italic flex items-center justify-center gap-4">
                    <Trophy size={32} className="text-blue-600" />
                    Награды и <span className="text-blue-600">достижения</span>
                </h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed max-w-2xl mx-auto">
                    Разблокируйте значки, выполняя заказы и достигая новых вершин. Получайте бонусы на баланс за каждое достижение!
                </p>
            </div>

            {/* Achievements Grid */}
            <AchievementBadges
                achievements={achievements}
                onClaim={handleClaim}
            />

            {/* Stats Footer */}
            {achievements.length > 0 && (
                <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <div className="grid grid-cols-3 gap-8 text-center divide-x divide-slate-50">
                        <div className="space-y-1">
                            <div className="text-4xl font-black text-[#171717] italic">
                                {achievements.length}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                                Открыто
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-4xl font-black text-blue-600 italic">
                                {achievements.filter(a => !a.claimed).length}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                                В ожидании
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-4xl font-black text-emerald-500 italic">
                                {achievements.filter(a => a.claimed).length}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                                Получено
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
