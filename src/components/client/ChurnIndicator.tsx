'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { TrendingDown, TrendingUp, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

interface ChurnIndicatorProps {
    orderId: string;
}

interface ChurnStats {
    orderId: string;
    initialCount: number | null;
    currentCount: number | null;
    totalDropoff: number;
    warrantyDays: number | null;
    daysInWarranty: number;
    daysRemaining: number;
    latestPrediction: {
        predictedChurn: number;
        confidenceScore: number;
        recommendedAction: string;
    } | null;
}

export function ChurnIndicator({ orderId }: ChurnIndicatorProps) {
    const [stats, setStats] = useState<ChurnStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchChurnStats = useCallback(async () => {
        try {
            const response = await fetch(`/api/client/orders/${orderId}/churn`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch churn stats:', error);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchChurnStats();
    }, [fetchChurnStats]);

    if (loading) {
        return (
            <div className="cyber-box p-6 bg-slate-900/30 border-slate-700/50 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary opacity-20" size={24} />
            </div>
        );
    }

    if (!stats || !stats.warrantyDays || !stats.initialCount) {
        return null; // No warranty tracking for this order
    }

    const dropRate = stats.totalDropoff;
    const prediction = stats.latestPrediction;
    const isCritical = prediction && Number(prediction.predictedChurn) >= 30;
    const isHigh = prediction && Number(prediction.predictedChurn) >= 20 && Number(prediction.predictedChurn) < 30;

    const recommendedQuantity = prediction && stats.currentCount && stats.daysRemaining > 0
        ? Math.ceil(stats.currentCount * (Number(prediction.predictedChurn) / 100) * (stats.daysRemaining / 7) * 1.1)
        : 0;

    return (
        <div className="space-y-4">
            {/* Critical Alert Banner */}
            {isCritical && (
                <div className="cyber-box p-4 bg-red-950/30 border-red-900/50 flex items-center gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={24} />
                    <div className="flex-1">
                        <div className="font-black text-sm text-red-400 uppercase tracking-wider">
                            Критический риск оттока!
                        </div>
                        <div className="text-xs text-red-300/80 mt-1">
                            Прогнозируется потеря {prediction.predictedChurn.toFixed(1)}% подписчиков. Рекомендуем срочно докупить.
                        </div>
                    </div>
                </div>
            )}

            {/* Warranty & Stats Card */}
            <div className="cyber-box p-6 bg-slate-900/30 border-slate-700/50 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Гарантия отслеживания
                        </div>
                        <div className="text-lg font-black text-white">
                            {stats.warrantyDays} дней
                            <span className="text-sm font-normal text-slate-400 ml-2">
                                (осталось {stats.daysRemaining})
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={fetchChurnStats}
                        className="cyber-box px-3 py-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 transition-all"
                        title="Обновить данные"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                {/* Subscriber Count */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                        <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">
                            Начальное
                        </div>
                        <div className="text-2xl font-black text-white">
                            {stats.initialCount?.toLocaleString()}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl relative">
                        <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">
                            Текущее
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-2xl font-black text-white">
                                {stats.currentCount?.toLocaleString() || '—'}
                            </div>
                            {dropRate !== 0 && (
                                <div className={`flex items-center gap-1 text-xs font-bold ${dropRate > 0 ? 'text-red-400' : 'text-emerald-400'
                                    }`}>
                                    {dropRate > 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                    {Math.abs(dropRate).toFixed(1)}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Predicted Churn */}
                {prediction && (
                    <div className="p-4 bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-xl border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">
                                    Прогноз оттока (7 дней)
                                </div>
                                <div className={`text-xl font-black ${isCritical ? 'text-red-400' : isHigh ? 'text-yellow-400' : 'text-blue-400'
                                    }`}>
                                    {prediction.predictedChurn.toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Точность: {(Number(prediction.confidenceScore) * 100).toFixed(0)}%
                                </div>
                            </div>
                            {(isCritical || isHigh) && recommendedQuantity > 0 && (
                                <div className="text-right">
                                    <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">
                                        Рекомендуем
                                    </div>
                                    <div className="text-2xl font-black text-primary">
                                        +{recommendedQuantity.toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Refill Button */}
                {(isCritical || isHigh) && recommendedQuantity > 0 && (
                    <button className="w-full cyber-box py-4 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 transition-all font-black uppercase tracking-wider text-sm">
                        🔄 Докупить сейчас (+{recommendedQuantity.toLocaleString()})
                    </button>
                )}
            </div>
        </div>
    );
}
