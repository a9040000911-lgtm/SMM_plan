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
    const search = formData.get('search') as string;
    const params = new URLSearchParams(searchParams.toString());

    if (search && search.trim() !== '') {
        params.set('search', search.trim());
    } else {
        params.delete('search');
    }

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
        <div className="space-y-2 flex-grow max-w-lg">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Поиск</label>
          <input
            type="text"
            name="search"
            defaultValue={initialSearch || ''}
            placeholder="Email, Имя, ID или Telegram ID..."
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-6">
          <button
            type="submit"
            className="px-10 py-2.5 bg-[#5c7fcd] text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-600 transition-all"
          >
            Поиск
          </button>

          {initialSearch && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Сбросить
              </button>
          )}
        </div>
      </form>
    </div>
  );
}


