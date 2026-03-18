'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, TrendingDown, RefreshCw, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AtRiskOrder {
    id: number;
    orderId: number;
    predictedChurn: number;
    confidenceScore: number;
    recommendedAction: string;
    notificationSent: boolean;
    createdAt: string;
    order: {
        id: string;
        link: string;
        warrantyDays: number;
        initialCount: number;
        currentCount: number;
        createdAt: string;
        user: {
            id: string;
            username: string;
            tgId: string;
        };
        internalService: {
            name: string;
            platform: string;
        };
    };
}

export default function ChurnDashboardPage() {
    const [orders, setOrders] = useState<AtRiskOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');
    const router = useRouter();

    useEffect(() => {
        fetchAtRiskOrders();
    }, []);

    const fetchAtRiskOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/churn/at-risk');
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch at-risk orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'critical') return Number(order.predictedChurn) >= 30;
        if (filter === 'high') return Number(order.predictedChurn) >= 20 && Number(order.predictedChurn) < 30;
        return true;
    });

    const stats = {
        total: orders.length,
        critical: orders.filter(o => Number(o.predictedChurn) >= 30).length,
        high: orders.filter(o => Number(o.predictedChurn) >= 20 && Number(o.predictedChurn) < 30).length,
        notified: orders.filter(o => o.notificationSent).length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary opacity-20" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                        <AlertTriangle className="text-yellow-500" size={32} />
                        Churn Prediction Dashboard
                    </h1>
                    <p className="text-sm text-slate-400">
                        Monitor subscriber drop-off and proactively recommend refills
                    </p>
                </div>
                <button
                    onClick={fetchAtRiskOrders}
                    className="cyber-box px-6 py-3 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 transition-all flex items-center gap-2 text-sm font-bold uppercase"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                <div className="cyber-box p-6 bg-slate-900/30 border-slate-700/50">
                    <div className="text-3xl font-black text-white">{stats.total}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">
                        Total At-Risk
                    </div>
                </div>
                <div className="cyber-box p-6 bg-red-950/20 border-red-900/50">
                    <div className="text-3xl font-black text-red-500">{stats.critical}</div>
                    <div className="text-xs text-red-400/70 uppercase tracking-widest font-bold mt-1">
                        Critical (&gt;30%)
                    </div>
                </div>
                <div className="cyber-box p-6 bg-yellow-950/20 border-yellow-900/50">
                    <div className="text-3xl font-black text-yellow-500">{stats.high}</div>
                    <div className="text-xs text-yellow-400/70 uppercase tracking-widest font-bold mt-1">
                        High (20-30%)
                    </div>
                </div>
                <div className="cyber-box p-6 bg-blue-950/20 border-blue-900/50">
                    <div className="text-3xl font-black text-blue-500">{stats.notified}</div>
                    <div className="text-xs text-blue-400/70 uppercase tracking-widest font-bold mt-1">
                        Notified
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Filter:</span>
                {[
                    { id: 'all', label: 'All' },
                    { id: 'critical', label: 'Critical' },
                    { id: 'high', label: 'High' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`cyber-box px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${filter === f.id
                            ? 'bg-primary/20 border-primary/50 text-primary'
                            : 'bg-slate-900/30 border-slate-700/50 text-slate-400 hover:text-white'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="cyber-box overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50 bg-slate-900/50">
                            <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                Order ID
                            </th>
                            <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                User
                            </th>
                            <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                Service
                            </th>
                            <th className="text-right p-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                Initial
                            </th>
                            <th className="text-right p-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                Current
                            </th>
                            <th className="text-right p-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                Predicted Churn
                            </th>
                            <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                Status
                            </th>
                            <th className="text-right p-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center p-12 text-slate-500">
                                    <TrendingDown size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-wider">
                                        {filter === 'all' ? 'No at-risk orders found' : `No ${filter} risk orders`}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(prediction => {
                                const churn = Number(prediction.predictedChurn);
                                const dropRate = prediction.order.initialCount && prediction.order.currentCount
                                    ? ((prediction.order.initialCount - prediction.order.currentCount) / prediction.order.initialCount * 100).toFixed(1)
                                    : '0';

                                return (
                                    <tr
                                        key={prediction.id}
                                        className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/admin/orders/${prediction.order.id}`)}
                                    >
                                        <td className="p-4">
                                            <div className="font-mono text-sm text-primary">
                                                {prediction.order.id}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-white">
                                                {prediction.order.user.username || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                TG: {prediction.order.user.tgId}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-white">
                                                {prediction.order.internalService.name}
                                            </div>
                                            <div className="text-xs text-slate-500 uppercase">
                                                {prediction.order.internalService.platform}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-sm font-mono text-white">
                                            {prediction.order.initialCount?.toLocaleString() || '—'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-sm font-mono text-white">
                                                {prediction.order.currentCount?.toLocaleString() || '—'}
                                            </div>
                                            <div className="text-xs text-red-400">
                                                -{dropRate}%
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black ${churn >= 30
                                                ? 'bg-red-950/50 text-red-400 border border-red-900/50'
                                                : churn >= 20
                                                    ? 'bg-yellow-950/50 text-yellow-400 border border-yellow-900/50'
                                                    : 'bg-blue-950/50 text-blue-400 border border-blue-900/50'
                                                }`}>
                                                <TrendingDown size={12} />
                                                {churn.toFixed(1)}%
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {prediction.notificationSent ? (
                                                <div className="inline-flex items-center gap-1 text-xs text-green-500">
                                                    <Send size={12} />
                                                    Notified
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500">Pending</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/admin/orders/${prediction.order.id}`);
                                                }}
                                                className="cyber-box px-3 py-1 text-xs font-bold uppercase bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


