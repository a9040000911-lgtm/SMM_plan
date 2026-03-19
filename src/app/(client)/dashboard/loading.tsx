/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
    return (
        <div className="space-y-6 pb-20 mt-4 animate-pulse">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-48 bg-slate-200 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Main Balance Card Skeleton */}
                <div className="lg:col-span-12 xl:col-span-7 h-64 bg-slate-200 rounded-[2rem]" />
                
                {/* Vertical Stat Column Skeleton */}
                <div className="lg:col-span-6 xl:col-span-2 flex flex-col gap-4">
                    <div className="h-32 bg-slate-100 rounded-[2rem] flex-1" />
                    <div className="h-32 bg-slate-100 rounded-[2rem] flex-1" />
                </div>
                
                {/* Total Spent Widget Skeleton */}
                <div className="lg:col-span-6 xl:col-span-3 h-64 bg-slate-100 rounded-[2rem]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 mt-6">
                {/* Recent Orders Skeleton */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-48 mb-6" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-[2rem]" />
                    ))}
                </div>
                
                {/* Quick Actions Skeleton */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-32 mb-6" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-[2.5rem]" />
                    ))}
                </div>
            </div>
            
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-300">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        </div>
    );
}
