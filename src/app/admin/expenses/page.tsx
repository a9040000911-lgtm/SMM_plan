/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import {
  Receipt,
  Trash2,
  TrendingDown
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import { ExpenseForm } from '@/components/admin/expenses/expense-form';

export const dynamic = 'force-dynamic';

async function getExpensesAndSession() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get('admin_session');
  if (!sessionData) return { expenses: [], session: null, allProjects: [] };
  const { verifyAdminSession } = await import('@/lib/jwt');
  const session = await verifyAdminSession(sessionData.value);
  if (!session) return { expenses: [], session: null, allProjects: [] };

  const where: any = {};
  if (!session.isGlobalAdmin) {
    where.projectId = { in: session.allowedProjects };
  }

  const expenses = await prisma.businessExpense.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 50,
  });

  const { ProjectService } = await import('@/services/core');
  const allProjects = session.isGlobalAdmin ? await ProjectService.getAllProjects() : [];

  return { expenses, session, allProjects };
}

export default async function ExpensesPage() {
  const { expenses: rawExpenses, session, allProjects: rawAllProjects } = await getExpensesAndSession();

  const expenses = rawExpenses.map(e => ({
    ...e,
    amount: e.amount.toNumber(),
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  const allProjects = rawAllProjects.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

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
        {/* Форма добавления */}
        <ExpenseForm
          categoriesMap={categoriesMap}
          projects={allProjects}
          isGlobalAdmin={session?.isGlobalAdmin || false}
        />

        {/* Список расходов */}
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
                      <form action={async () => { 'use server'; await prisma.businessExpense.delete({ where: { id: e.id } }); }}>
                        <button type="submit" className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </form>
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
