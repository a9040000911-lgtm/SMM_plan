"use client";

import React from 'react';
import useSWR from 'swr';
import { ShieldAlert, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function GlobalAdminAlert() {
  const { data: stats } = useSWR('/api/admin/stats', fetcher, { 
      refreshInterval: 60000,
      revalidateOnFocus: true
  });

  if (!stats) return null;

  const hasStuckOrders = stats.stuckOrdersCount > 0;
  const hasAbuse = stats.pricingAnalytics?.stats?.abuse > 0;

  if (!hasStuckOrders && !hasAbuse) return null;

  return (
    <div className="bg-rose-600 text-white shadow-md w-full relative z-40 border-b border-rose-700">
      <div className="flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-rose-500/50">
          
          {hasStuckOrders && (
              <div className="flex-1 flex items-center justify-between px-6 py-2.5">
                  <div className="flex items-center gap-3">
                      <ShieldAlert size={16} className="text-rose-200 animate-pulse" />
                      <span className="text-xs font-semibold">
                          Обнаружено <strong className="text-white bg-rose-700 px-1.5 py-0.5 rounded-md">{stats.stuckOrdersCount}</strong> зависших заказов (остановка API)
                      </span>
                  </div>
                  <Link 
                      href="/admin/orders?status=STUCK" 
                      className="ml-4 flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all"
                  >
                      Решить проблему <ChevronRight size={12} />
                  </Link>
              </div>
          )}

          {hasAbuse && (
              <div className="flex-1 flex items-center justify-between px-6 py-2.5 bg-red-700/30">
                  <div className="flex items-center gap-3">
                      <AlertTriangle size={16} className="text-red-300 animate-pulse" />
                      <span className="text-xs font-semibold">
                          Price Abuse: <strong className="text-white bg-red-800 px-1.5 py-0.5 rounded-md">{stats.pricingAnalytics.stats.abuse}</strong> услуг с экстремальной наценкой
                      </span>
                  </div>
                  <Link 
                      href="/admin/services" 
                      className="ml-4 flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all"
                  >
                      Проверить лимиты <ChevronRight size={12} />
                  </Link>
              </div>
          )}
          
      </div>
    </div>
  );
}
