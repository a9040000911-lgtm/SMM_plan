/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
  Receipt,
  TrendingDown
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import { ExpenseForm } from '@/components/admin/expenses/expense-form';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';
import { DeleteExpenseButton } from '@/components/admin/expenses/delete-expense-button';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const session = await getAdminSession();
  if (!session) return null;

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.getExpensesData(ctx);
  if (!result.success) {
    return <div className="p-8 text-red-500">Ошибка: {result.error.message}</div>;
  }

  const { expenses, allProjects } = result.data;
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const categoriesMap: any = {
    SALARY: { label: 'Зарплаты', color: 'bg-blue-50 text-blue-700' },
    MARKETING: { label: 'Маркетинг', color: 'bg-purple-50 text-purple-700' },
    SEO: { label: 'SEO', color: 'bg-indigo-50 text-indigo-700' },
    ADS: { label: 'Реклама', color: 'bg-orange-50 text-orange-700' },
    TAX: { label: 'Налоги', color: 'bg-rose-50 text-rose-700' },
    SERVER: { label: 'Серверы', color: 'bg-slate-50 text-slate-700' },
    OFFICE: { label: 'Офис', color: 'bg-amber-50 text-amber-700' },
    OTHER: { label: 'Прочее', color: 'bg-slate-100 text-slate-600' },
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Receipt className="text-slate-400" />
            Бизнес-расходы
          </h2>
          <p className="text-sm text-slate-500">Учет операционных трат для расчета чистой прибыли.</p>
        </div>
        <div className="bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 text-right">
          <span className="text-[10px] font-black text-rose-400 uppercase block tracking-widest mb-1 leading-none">Всего расходов</span>
          <span className="text-xl font-black text-rose-700">-{formatAmount(totalExpenses)}₽</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <ExpenseForm
          categoriesMap={categoriesMap}
          projects={allProjects}
          isGlobalAdmin={session.isGlobalAdmin}
        />

        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2 text-sm">
              <TrendingDown size={18} className="text-rose-500" />
              Журнал последних трат
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${categoriesMap[e.category]?.color}`}>
                          {categoriesMap[e.category]?.label}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{e.description || 'Без описания'}</span>
                          <span className="text-[10px] text-slate-400" suppressHydrationWarning>{new Date(e.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-black text-rose-600">-{formatAmount(e.amount)}₽</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DeleteExpenseButton expenseId={e.id} />
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-20 text-center text-slate-400 italic">Расходы еще не зафиксированы</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
