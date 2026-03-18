'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function UserFilter({
  initialSearch,
  // eslint-disable-next-line unused-imports/no-unused-vars
  initialRole,
  // eslint-disable-next-line unused-imports/no-unused-vars
  roleNames
}: {
  initialSearch: string,
  initialRole: string,
  roleNames: Record<string, string>
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get('userId') as string;
    const email = formData.get('email') as string;
    const params = new URLSearchParams(searchParams.toString());

    // Combine into a generic search param or use specific ones if the page handles them
    // Looking at current page.tsx, it uses 'search' param.
    // I'll keep it simple: if either is set, use it as 'search'. 
    // If both are set, maybe combine? Or better, just use specific params.
    // Let's check how UsersPage handles search.
    // Currently it checks if it's numeric for tgId, or contains for email/username/id.

    const combinedSearch = id || email;

    if (combinedSearch) params.set('search', combinedSearch);
    else params.delete('search');

    params.set('page', '1');
    router.push(`/admin/users?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push('/admin/users');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Фильтр</div>
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">ID</label>
          <input
            type="text"
            name="userId"
            className="w-64 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
          <input
            type="text"
            name="email"
            defaultValue={initialSearch && !/^\d+$/.test(initialSearch) ? initialSearch : ''}
            className="w-64 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-6">
          <button
            type="submit"
            className="px-10 py-2.5 bg-[#5c7fcd] text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-600 transition-all"
          >
            Поиск
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Сбросить
          </button>
        </div>
      </form>
    </div>
  );
}


