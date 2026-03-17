/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
  Plus,
  Pencil,
  Shield
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import Link from 'next/link';
import { UserFilter } from '@/components/admin/users/user-filter';
import { Pagination } from '@/components/admin/core/pagination';
import { getAdminSession } from '@/utils/admin-session';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { CopyButton } from '@/components/admin/core/copy-button';
import { DeleteUserButton } from '@/components/admin/users/delete-user-button';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session) return null;

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const role = typeof params.role === 'string' ? params.role : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const limit = parseInt(typeof params.limit === 'string' ? params.limit : '50') || 50;
  const page = parseInt(typeof params.page === 'string' ? params.page : '1') || 1;

  const result = await AdminDataService.getUsersPaged(ctx, { role, search, page, limit });

  if (!result.success) {
    return <div className="p-8 text-red-500">Ошибка: {result.error.message}</div>;
  }

  const { users, totalMatching, totalGlobal } = result.data;

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen">
      <AdminHeader
        title="Управление пользователями"
        subtitle="Аналитика клиентской базы и управление ролями"
        rightElement={
          <Link
            href="/admin/users/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-900/20"
          >
            <Plus size={16} />
            Создать пользователя
          </Link>
        }
      />

      <div className="flex gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center gap-2 w-56">
          <div className="text-3xl font-black text-slate-800 font-mono italic tracking-tighter">{totalGlobal}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Всего пользователей</div>
        </div>
      </div>

      <UserFilter
        initialSearch={search || ''}
        initialRole={role || 'ALL'}
        roleNames={{}}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Список пользователей</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="w-12 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider">ID ▲</th>
                <th className="w-32 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider">ИМЯ</th>
                <th className="w-44 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider">EMAIL</th>
                <th className="w-24 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider text-center">БАЛАНС</th>
                <th className="w-24 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider text-center">СКИДКА КЛИЕНТА</th>
                <th className="w-24 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider text-center">ПАРТН. БАЛАНС</th>
                <th className="w-24 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider text-center">УРОВЕНЬ ПАРТНЕРА</th>
                <th className="w-24 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider text-center">ПРОЦЕНТ ПАРТНЕРА</th>
                <th className="w-20 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider text-center">СТАТУС</th>
                <th className="w-28 px-3 py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider">СОЗДАН</th>
                <th className="w-20 px-3 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider text-right">ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-3 py-4 font-medium text-slate-400">
                    <div className="flex items-center gap-1">
                      {user.index}
                      <CopyButton value={user.id} label="User ID" />
                    </div>
                  </td>
                  <td className="px-3 py-4 truncate">
                    <Link href={`/admin/users/${user.id}`} className="font-bold text-blue-600 hover:underline">
                      {user.username || '-'}
                    </Link>
                    {user.isGlobalAdmin && (
                      <div className="flex items-center gap-1 mt-1">
                        <Shield size={10} className="text-amber-500 fill-amber-500" />
                        <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Super Admin</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 text-slate-500 font-medium truncate" title={user.email || ''}>{user.email || '-'}</td>
                  <td className="px-3 py-4 font-bold text-slate-700 text-center">{formatAmount(user.balance)} ₽</td>
                  <td className="px-3 py-4 text-center font-bold text-slate-700">{user.discount}</td>
                  <td className="px-3 py-4 text-center font-bold text-slate-700">{formatAmount(user.referralEarnings)} ₽</td>
                  <td className="px-3 py-4 text-center font-bold text-slate-700">{user.partnerLevel}</td>
                  <td className="px-3 py-4 text-center font-bold text-slate-700">
                    {user.partnerPercent === 0 ? 'По умолчанию' : `${user.partnerPercent}%`}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tight ${user.isBanned
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-[#00c985] text-white'}`}>
                      {user.isBanned ? 'Забанен' : 'Активна'}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-[9px] font-medium text-slate-400 leading-tight">
                      {new Date(user.createdAt).toISOString().split('T')[0]}<br />
                      {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/users/${user.id}`} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                        <Pencil size={13} />
                      </Link>
                      <DeleteUserButton userId={user.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end">
          <Pagination totalPages={Math.ceil(totalMatching / limit)} />
        </div>
      </div>
    </div>
  );
}
