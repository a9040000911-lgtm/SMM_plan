/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { formatServiceId } from '@/utils/id-formatter';
import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus, Platform, Category } from '@/generated/client';
import { AdminOrder } from '@/types/admin';
import {
  ShoppingBag,
  ChevronRight,
  Clock,
  User as UserIcon,
  Edit2,
  Trash2
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import Link from 'next/link';
import { OrderFilter } from '@/components/admin/orders/order-filter';
import { BulkOrderActions } from '@/components/admin/orders/bulk-order-actions';
import { Pagination } from '@/components/admin/core/pagination';
import { LiveRefresh } from '@/components/admin/core/live-refresh';
import { InlineSyncButton } from '@/components/admin/providers/inline-sync-button';
import { SyncAllButton } from '@/components/admin/orders/sync-all-button';
import { getOrderStatusLabel, getOrderStatusColor } from '@/utils/order-utils';
import { getAdminSession } from '@/utils/admin-session';
import { OrderInformationCell } from '@/components/admin/orders/order-information-cell';
import { toPlainObject } from '@/utils/serialization';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { UserQuickView } from '@/components/admin/users/user-quick-view';
import { CopyButton } from '@/components/admin/core/copy-button';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getAdminSession();

  const status = typeof params.status === 'string' ? params.status : 'ALL';
  const search = typeof params.search === 'string' ? params.search : '';
  const platform = typeof params.platform === 'string' ? params.platform : 'ALL';
  const projectId = typeof params.projectId === 'string' ? params.projectId : 'ALL';
  const provider = typeof params.provider === 'string' ? params.provider : 'ALL';
  const category = typeof params.category === 'string' ? params.category : 'ALL';
  const serviceId = typeof params.serviceId === 'string' ? params.serviceId : 'ALL';
  const dateFrom = typeof params.dateFrom === 'string' ? params.dateFrom : '';
  const dateTo = typeof params.dateTo === 'string' ? params.dateTo : '';

  const PAGE_SIZE = parseInt(typeof params.limit === 'string' ? params.limit : '50') || 50;
  const currentPage = parseInt(typeof params.page === 'string' ? params.page : '1') || 1;
  const skip = (currentPage - 1) * PAGE_SIZE;

  const isGlobalAdmin = session?.isGlobalAdmin || false;
  const allowedProjects = session?.allowedProjects || [];

  const where: Prisma.OrderWhereInput = {};

  if (!isGlobalAdmin) {
    where.projectId = { in: allowedProjects };
  }
  if (status && status !== 'ALL') {
    where.status = status as OrderStatus;
  }
  if (platform && platform !== 'ALL') {
    where.internalService = { platform: platform as Platform };
  }
  if (projectId && projectId !== 'ALL') {
    where.projectId = projectId;
  }
  if (provider && provider !== 'ALL') {
    where.internalService = { providerMappings: { some: { providerId: provider } } };
  }
  if (category && category !== 'ALL') {
    where.internalService = { category: category as Category };
  }
  if (serviceId && serviceId !== 'ALL') {
    where.internalServiceId = serviceId;
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  if (search) {
    const isNumeric = /^\d+$/.test(search);
    where.OR = [
      ...(isNumeric ? [{ id: parseInt(search) }] : []),
      { externalId: { contains: search, mode: 'insensitive' } },
      { link: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [orders, totalOrdersMatching, allProjects, allProviders] = await Promise.all([
    prisma.order.findMany({
      where,
      take: PAGE_SIZE,
      skip: skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        project: true,
        internalService: {
          include: {
            providerMappings: {
              include: {
                provider: true
              }
            }
          }
        },
      },
    }),
    prisma.order.count({ where }),
    prisma.project.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, brandColor: true }
    }),
    prisma.provider.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    })
  ]);

  const projectsForFilter = allProjects.map(p => ({
    id: p.id,
    name: p.name,
    color: p.brandColor
  }));

  const serializedOrders = toPlainObject(orders) as unknown as AdminOrder[];

  const statusMap = {
    'PENDING': 'Ожидает',
    'PROCESSING': 'В обработке',
    'IN_PROGRESS': 'Выполняется',
    'COMPLETED': 'Завершен',
    'PARTIAL': 'Частично',
    'CANCELED': 'Отменен',
    'ERROR': 'Ошибка'
  };

  return (
    <div className="p-4 sm:p-5 space-y-6 selection:bg-blue-100">
      <AdminHeader
        title="Логистика заказов"
        subtitle="Мониторинг и управление транзакциями"
        rightElement={
          <div className="flex items-center gap-3">
            <SyncAllButton />
            <LiveRefresh />
          </div>
        }
      />

      <OrderFilter
        projects={projectsForFilter}
        providers={allProviders}
        initialSearch={search}
        initialStatus={status}
        initialPlatform={platform}
        initialProjectId={projectId}
        initialProvider={provider}
        initialCategory={category}
        initialServiceId={serviceId}
        initialDateFrom={dateFrom}
        initialDateTo={dateTo}
        statusMap={statusMap}
        platforms={['INSTAGRAM', 'TELEGRAM', 'TIKTOK', 'YOUTUBE', 'VK', 'FACEBOOK', 'THREADS']}
        categories={[
          'SUBSCRIBERS', 'LIKES', 'VIEWS', 'COMMENTS', 'REACTIONS',
          'REPOSTS', 'BOOSTS', 'POLLS', 'STORIES', 'BOTS',
          'REFERRALS', 'FRIENDS', 'PLAYS', 'TRAFFIC', 'DISLIKES',
          'STARS', 'WATCH_TIME', 'SAVES', 'OTHER'
        ]}
      />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px]">
        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <ShoppingBag size={16} />
            </div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Список заказов ({totalOrdersMatching})</span>
          </div>
          <Pagination totalPages={Math.ceil(totalOrdersMatching / PAGE_SIZE)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-4 py-4 w-[40px]">
                  <input type="checkbox" className="master-checkbox w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[80px]">ID</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[150px]">Пользователь</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[350px]">Информация</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[90px]">Цена</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[120px]">Статус</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[120px]">Создана</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[150px]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900">
              {serializedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-all group duration-200">
                  <td className="px-4 py-6 align-top">
                    <input
                      type="checkbox"
                      value={order.id}
                      className="order-checkbox w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"
                    />
                  </td>
                  <td className="px-4 py-6 align-top">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/orders/${order.id}`} className="text-[11px] font-black text-blue-600 hover:text-blue-700 underline decoration-blue-200 decoration-1 underline-offset-2">
                        {formatServiceId(order.internalService.platform, order.internalService.category, order.id)}
                      </Link>
                      <CopyButton value={String(order.id)} label="ID заказа" />
                    </div>
                  </td>

                  <td className="px-4 py-6 align-top">
                    <UserQuickView
                      userId={order.userId}
                      trigger={
                        <button className="text-[11px] font-bold text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-left">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <UserIcon size={10} />
                          </div>
                          <span className="break-all leading-tight">{order.user?.email || order.user?.username || '—'}</span>
                        </button>
                      }
                    />
                  </td>

                  <td className="px-4 py-6 align-top overflow-hidden">
                    <OrderInformationCell order={order} />
                  </td>

                  <td className="px-4 py-6 align-top text-right">
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Продажа:</div>
                      <div className="text-sm font-black text-slate-900">{formatAmount(order.totalPrice)}₽</div>
                      {order.costPrice && (
                        <div className="mt-1 flex flex-col items-end">
                          <div className="text-[9px] font-bold text-slate-400 uppercase">Закупка:</div>
                          <div className="text-[10px] font-bold text-slate-500 font-mono italic">
                            {formatAmount(order.costPrice)}₽
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-6 align-top text-center">
                    <span
                      className="text-[10px] font-black px-3 py-1.5 rounded-xl border-2 uppercase tracking-tight"
                      style={{
                        backgroundColor: `${getOrderStatusColor(order.status as any)}08`,
                        color: getOrderStatusColor(order.status as any),
                        borderColor: `${getOrderStatusColor(order.status as any)}15`
                      }}
                    >
                      {getOrderStatusLabel(order.status as any)}
                    </span>
                  </td>

                  <td className="px-4 py-6 align-top">
                    <div className="text-[11px] font-bold text-slate-600 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-300" />
                        {new Date(order.createdAt).toISOString().split('T')[0]}
                      </div>
                      <div className="text-slate-400 ml-4.5">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-6 align-top text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                      <InlineSyncButton orderId={order.id} />
                      <Link href={`/admin/orders/${order.id}`} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <Pagination totalPages={Math.ceil(totalOrdersMatching / PAGE_SIZE)} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Показано {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, totalOrdersMatching)} из {totalOrdersMatching}
          </p>
        </div>
      </div>

      <BulkOrderActions orders={serializedOrders} />
    </div>
  );
}
