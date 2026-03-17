/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { StaffAccessEditor } from '@/components/admin/core/staff-access-editor';
import { CreateEmployeeModal } from '@/components/admin/employees/create-employee-modal';
import { StaffDeleteButton } from '@/components/admin/employees/staff-delete-button';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const session = await getAdminSession();
  if (!session) return null;

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.getStaffData(ctx);
  if (!result.success) {
    return <div className="p-8 text-red-500">Ошибка: {result.error.message}</div>;
  }

  const { staff, allProjects } = result.data;

  const roleNames: Record<string, string> = {
    'ADMIN': 'Администратор',
    'SUPPORT': 'Поддержка',
    'SEO': 'SEO-специалист'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic uppercase">Команда и Доступы</h2>
          <p className="text-sm text-slate-500 font-medium">Управление сотрудниками, ролями и правами доступа ({staff.length} чел.)</p>
        </div>
        {session.isGlobalAdmin && (
          <CreateEmployeeModal allProjects={allProjects} />
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-tl-[2rem]">Сотрудник</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Роль</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Доступ к проектам</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Логи</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Активность</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Статус</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-tr-[2rem]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {staff.map((user, index) => {
              const isLast = index === staff.length - 1;
              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className={`px-6 py-4 ${isLast ? 'rounded-bl-[2rem]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[10px] uppercase text-white ${user.role === 'ADMIN' ? 'bg-rose-500' :
                        user.role === 'SUPPORT' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}>
                        {(user.username || 'S').substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <Link href={`/admin/users/${user.id}`} className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">
                          @{user.username || 'unknown'}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${user.role === 'ADMIN' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      user.role === 'SUPPORT' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                      {roleNames[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <StaffAccessEditor
                        userId={user.id}
                        isGlobal={user.isGlobalAdmin}
                        accessibleProjectIds={(user.accessibleProjects || []).map((p: any) => p.id)}
                        allProjects={allProjects}
                        allowedTabs={user.allowedTabs}
                        permissions={user.permissions || []}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{user.actionsCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.lastActionAt ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{new Date(user.lastActionAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(user.lastActionAt).toLocaleTimeString()}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.lastActionAt && (Date.now() - new Date(user.lastActionAt).getTime() < 24 * 3600000) ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Активен
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Не в сети</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-right ${isLast ? 'rounded-br-[2rem]' : ''}`}>
                    <StaffDeleteButton userId={user.id} username={user.username || 'unknown'} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
