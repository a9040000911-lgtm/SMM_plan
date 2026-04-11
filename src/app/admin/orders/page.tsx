/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import {
  ShoppingBag,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { OrderFilter } from '@/components/admin/orders/order-filter';
import { BulkOrderActions } from '@/components/admin/orders/bulk-order-actions';
import { Pagination } from '@/components/admin/core/pagination';
import { LiveRefresh } from '@/components/admin/core/live-refresh';
import { SyncAllButton } from '@/components/admin/orders/sync-all-button';
import { getAdminSession, getActiveProjectId } from '@/utils/admin-session';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { AdminTableCard } from '@/components/admin/core/admin-table-card';
import { AdminOrderTable } from '@/components/admin/orders/AdminOrderTable';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';
import { OrderSelectionProvider } from '@/components/admin/orders/order-selection-context';

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
  const urlProjectId = typeof params.projectId === 'string' ? params.projectId : undefined;
  const activeWorkspaceId = await getActiveProjectId();
  const projectId = urlProjectId || activeWorkspaceId || 'ALL';
  const provider = typeof params.provider === 'string' ? params.provider : 'ALL';
  const category = typeof params.category === 'string' ? params.category : 'ALL';
  const serviceId = typeof params.serviceId === 'string' ? params.serviceId : 'ALL';
  const dateFrom = typeof params.dateFrom === 'string' ? params.dateFrom : '';
  const dateTo = typeof params.dateTo === 'string' ? params.dateTo : '';
  const limit = parseInt(typeof params.limit === 'string' ? params.limit : '50') || 50;
  const page = parseInt(typeof params.page === 'string' ? params.page : '1') || 1;
  const stuck = params.stuck === 'true';

  const [result, statsResult] = await Promise.all([
     AdminDataService.getOrdersPaged(ctx, {
       status, search, platform, projectId, provider, category, serviceId, dateFrom, dateTo, stuck, page, limit
     }),
     AdminDataService.getStuckStats(ctx, projectId)
  ]);

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
        title="Заказы"
        subtitle="Мониторинг выполнения и ручное управление процессами"
        rightElement={
          <div className="flex items-center gap-3">
            <SyncAllButton />
            <LiveRefresh />
          </div>
        }
      />

      {statsResult.success && statsResult.data.totalStuck > 0 && !stuck && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500"></div>
             <div className="flex items-center gap-4 text-rose-700">
                 <div className="p-3 bg-white rounded-xl shadow-sm border border-rose-100 animate-pulse">
                     <AlertTriangle size={20} className="text-rose-600" />
                 </div>
                 <div>
                     <h3 className="font-black tracking-tight text-lg">Внимание: Зависшие заказы ({statsResult.data.totalStuck})</h3>
                     <p className="text-xs font-medium text-rose-600/80 mt-0.5">
                         Обнаружено {statsResult.data.pendingCount} в PENDING (&gt;24ч) и {statsResult.data.processingCount} в PROCESSING (&gt;48ч). Требуется ручная отмена у провайдера.
                     </p>
                 </div>
             </div>
             <Link 
                 href="?stuck=true" 
                 className="whitespace-nowrap inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-md shadow-rose-200"
             >
                 Разобрать зависшие <ArrowRight size={14} />
             </Link>
        </div>
      )}

      {stuck && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3 text-amber-800 font-bold text-sm tracking-tight">
                 <AlertTriangle size={16} /> Режим разбора проблемных заказов (SLA Breach)
             </div>
             <Link 
                 href="/admin/orders" 
                 className="text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-800 transition-colors"
             >
                 Сбросить фильтр
             </Link>
        </div>
      )}

      <OrderSelectionProvider>
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

      <AdminTableCard 
        title={`Список заказов (${totalMatching})`} 
        icon={ShoppingBag}
        rightElement={<Pagination totalPages={Math.ceil(totalMatching / limit)} />}
      >

        <AdminOrderTable orders={orders} />

        <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <Pagination totalPages={Math.ceil(totalMatching / limit)} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {totalMatching === 0
              ? 'Заказов нет'
              : `Показано ${(page - 1) * limit + 1} – ${Math.min(page * limit, totalMatching)} из ${totalMatching}`}
          </p>
        </div>
      </AdminTableCard>

      <BulkOrderActions />
      </OrderSelectionProvider>
    </div>
  );
}


