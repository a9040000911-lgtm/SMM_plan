/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
  ShoppingBag,
} from 'lucide-react';
import { OrderFilter } from '@/components/admin/orders/order-filter';
import { BulkOrderActions } from '@/components/admin/orders/bulk-order-actions';
import { Pagination } from '@/components/admin/core/pagination';
import { LiveRefresh } from '@/components/admin/core/live-refresh';
import { SyncAllButton } from '@/components/admin/orders/sync-all-button';
import { getAdminSession } from '@/utils/admin-session';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { AdminOrderTable } from '@/components/admin/orders/AdminOrderTable';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session) return null;

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const status = typeof params.status === 'string' ? params.status : 'ALL';
  const search = typeof params.search === 'string' ? params.search : '';
  const platform = typeof params.platform === 'string' ? params.platform : 'ALL';
  const projectId = typeof params.projectId === 'string' ? params.projectId : 'ALL';
  const provider = typeof params.provider === 'string' ? params.provider : 'ALL';
  const category = typeof params.category === 'string' ? params.category : 'ALL';
  const serviceId = typeof params.serviceId === 'string' ? params.serviceId : 'ALL';
  const dateFrom = typeof params.dateFrom === 'string' ? params.dateFrom : '';
  const dateTo = typeof params.dateTo === 'string' ? params.dateTo : '';
  const limit = parseInt(typeof params.limit === 'string' ? params.limit : '50') || 50;
  const page = parseInt(typeof params.page === 'string' ? params.page : '1') || 1;

  const result = await AdminDataService.getOrdersPaged(ctx, {
    status, search, platform, projectId, provider, category, serviceId, dateFrom, dateTo, page, limit
  });

  if (!result.success) {
    return <div className="p-8 text-red-500">Ошибка: {result.error.message}</div>;
  }

  const { orders, totalMatching, projects, providers } = result.data;

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
        projects={projects.map(p => ({ id: p.id, name: p.name, color: p.brandColor }))}
        providers={providers}
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
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Список заказов ({totalMatching})</span>
          </div>
          <Pagination totalPages={Math.ceil(totalMatching / limit)} />
        </div>

        <AdminOrderTable orders={orders} />

        <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <Pagination totalPages={Math.ceil(totalMatching / limit)} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Показано {(page - 1) * limit + 1} - {Math.min(page * limit, totalMatching)} из {totalMatching}
          </p>
        </div>
      </div>

      <BulkOrderActions orders={orders} />
    </div>
  );
}


