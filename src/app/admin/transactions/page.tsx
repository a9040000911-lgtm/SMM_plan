/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { prisma } from '@/lib/prisma';
import {
  PlusCircle,
  MinusCircle,
  RotateCcw,
  Hash
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import { ProjectService } from '@/services/core';
import Link from 'next/link';
import { TransactionFilter } from '@/components/admin/transaction-filter';
import { ExportCsvButton } from '@/components/admin/orders/export-csv-button';
import { Pagination } from '@/components/admin/core/pagination';
import { LiveRefresh } from '@/components/admin/core/live-refresh';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Параметры пагинации
  const PAGE_SIZE = parseInt(typeof params.limit === 'string' ? params.limit : '100') || 100;
  const currentPage = parseInt(typeof params.page === 'string' ? params.page : '1') || 1;
  const skip = (currentPage - 1) * PAGE_SIZE;

  const type = typeof params.type === 'string' ? params.type : undefined;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const minAmount = typeof params.minAmount === 'string' ? params.minAmount : undefined;
  const maxAmount = typeof params.maxAmount === 'string' ? params.maxAmount : undefined;
  const startDate = typeof params.startDate === 'string' ? params.startDate : undefined;
  const endDate = typeof params.endDate === 'string' ? params.endDate : undefined;
  const userId = typeof params.userId === 'string' ? params.userId : undefined;


  const cookieStore = await cookies();
  const sessionData = cookieStore.get('admin_session');
  let allowedProjects: string[] = [];
  let isGlobalAdmin = false;
  let allProjects: any[] = []; // Added: Initialize allProjects

  if (sessionData) {
    const { verifyAdminSession } = await import('@/services/core/jwt');
    const session = await verifyAdminSession(sessionData.value);

    if (session) {
      isGlobalAdmin = session.isGlobalAdmin;
      allowedProjects = session.allowedProjects || [];
      if (isGlobalAdmin) { // Added: Fetch all projects if global admin
        allProjects = await ProjectService.getAllProjects();
      }
    }
  }

  const projectId = typeof params.projectId === 'string' ? params.projectId : undefined; // Added: Get projectId from searchParams

  const where: any = {};

  if (projectId) {
    if (isGlobalAdmin || allowedProjects.includes(projectId)) {
      where.projectId = projectId;
    } else {
      // If project specified but no access, show nothing or default to allowed
      where.projectId = { in: allowedProjects };
    }
  } else if (!isGlobalAdmin) {
    where.projectId = { in: allowedProjects };
  }
  if (userId) where.userId = userId;
  if (type && type !== 'ALL') where.type = type;
  if (status && status !== 'ALL') where.status = status;
  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = parseFloat(minAmount);
    if (maxAmount) where.amount.lte = parseFloat(maxAmount);
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (search) {
    const isNumeric = /^\d+$/.test(search);
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { externalId: { contains: search, mode: 'insensitive' } },
      { userId: { contains: search, mode: 'insensitive' } },
      { user: { username: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      isNumeric ? { user: { tgId: BigInt(search) } } : undefined,
    ].filter(Boolean);
  }

  const [transactions, totalMatchingTxs] = await Promise.all([
    prisma.transaction.findMany({
      where,
      take: PAGE_SIZE,
      skip: skip,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    }),
    prisma.transaction.count({ where })
  ]);

  const serializedTransactions = transactions.map(tx => ({
    ...tx,
    amount: tx.amount.toString(),
    user: {
      ...tx.user,
      balance: tx.user.balance.toString(),
      spent: tx.user.spent.toString(),
      referralEarnings: tx.user.referralEarnings.toString(),
    }
  }));

  const totalAmountOnPage = transactions.reduce((acc, tx) => acc + tx.amount.toNumber(), 0).toString();

  const typeMap: any = {
    DEPOSIT: { label: 'Пополнение баланса', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: PlusCircle },
    WITHDRAWAL: { label: 'Списание средств', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: MinusCircle },
    WITHDRAW: { label: 'Списание (old)', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: MinusCircle },
    REFUND: { label: 'Возврат средств', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: RotateCcw },
    NEW_ORDER: { label: 'Создан новый заказ', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: Hash },
    ORDER_PAYMENT: { label: 'Оплата заказа', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: Hash },
    ORDER_STATUS_CHANGE: { label: 'Смена статуса заказа', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Hash },
  };

  const statusMap: any = {
    COMPLETED: { label: 'Выполнено', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    SUCCESS: { label: 'Выполнено (old)', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    PENDING: { label: 'Ожидание', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    ERROR: { label: 'Ошибка', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    FAILED: { label: 'Ошибка (old)', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  };

  const filterData = { userId, search, type, status, minAmount, maxAmount, startDate, endDate };

  return (
    <div className="space-y-6 text-[13px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic uppercase">Финансовый журнал</h2>
          <p className="text-sm text-slate-500 font-medium">История операций (всего: {totalMatchingTxs})</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveRefresh />
          <ExportCsvButton params={filterData} />
          <div className="bg-white px-6 py-3 rounded-md border border-slate-200 shadow-sm text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-widest mb-1 leading-none">Сумма на странице</span>
            <span className="text-xl font-black text-slate-800">{formatAmount(totalAmountOnPage)}₽</span>
          </div>
        </div>
      </div>

      <TransactionFilter
        initialParams={{ ...filterData, projectId }}
        projects={allProjects}
        isGlobalAdmin={isGlobalAdmin}
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden font-medium">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Информация</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Пользователь</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Заказ</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Сумма</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Описание</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Тип / Статус</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serializedTransactions.map((tx, index) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold mb-0.5">#{skip + index + 1}</span>
                      <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-tighter" title={`UUID: ${tx.id}`}>
                        {tx.id.split('-')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <Link href={`/admin/users/${tx.user.id}`} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors truncate max-w-[120px]">
                        {tx.user.username || tx.user.email?.split('@')[0] || 'user'}
                      </Link>
                      <span className="text-[9px] text-slate-400 truncate max-w-[120px]">{tx.user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {tx.orderId ? (
                      <Link href={`/admin/orders/${tx.orderId}`} className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-all">
                        #{tx.orderId}
                      </Link>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-black text-slate-800">
                      {formatAmount(tx.amount)} ₽
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-[150px] truncate text-slate-500 text-[10px] font-bold" title={((tx.metadata as any)?.description || (tx.metadata as any)?.adminNote || '-')}>
                      {((tx.metadata as any)?.description || (tx.metadata as any)?.adminNote || '-')}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase border w-fit ${typeMap[tx.type]?.color || 'bg-slate-50 text-slate-500'}`}>
                        {typeMap[tx.type]?.label || tx.type}
                      </span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-sm uppercase border w-fit ${statusMap[tx.status]?.color || 'bg-slate-50 text-slate-500'}`}>
                        {statusMap[tx.status]?.label || tx.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-600 font-black tracking-tight" suppressHydrationWarning>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold" suppressHydrationWarning>
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination totalPages={Math.ceil(totalMatchingTxs / PAGE_SIZE)} />
    </div>
  );
}


