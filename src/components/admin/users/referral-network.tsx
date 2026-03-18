'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  ExternalLink
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import Link from 'next/link';

export function ReferralNetwork({ data }: { data: any }) {
  const { referrals, stats } = data;

  return (
    <div className="space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Users size={20} /></div>
            <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Приглашено</div>
                <div className="text-lg font-black text-slate-800">{stats.totalCount} чел.</div>
            </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingUp size={20} /></div>
            <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Оборот сети</div>
                <div className="text-lg font-black text-slate-800">{formatAmount(stats.totalSpent)}₽</div>
            </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><DollarSign size={20} /></div>
            <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Средний LTV</div>
                <div className="text-lg font-black text-slate-800">{formatAmount(stats.averageLTV)}₽</div>
            </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} />
                Список приглашенных
            </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                <th className="px-6 py-3">Пользователь</th>
                <th className="px-6 py-3 text-right">Траты</th>
                <th className="px-6 py-3 text-center">Заказов</th>
                <th className="px-6 py-3 text-right">Регистрация</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {referrals.map((ref: any) => (
                <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">@{ref.username || 'user'}</span>
                        <span className="text-[9px] text-slate-400 truncate max-w-[100px]">{ref.email || ref.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-xs font-black text-emerald-600">{formatAmount(ref.spent)}₽</span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-xs font-bold text-slate-600">{ref._count.orders}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(ref.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link href={`/admin/users/${ref.id}`} className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors">
                        <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs italic">Этот пользователь еще никого не пригласил</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


