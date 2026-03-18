/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { 
  Globe, 
  Briefcase,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';
import { DeleteNewsButton } from '@/components/admin/news/delete-news-button';

import { getAdminSession, getActiveProjectId } from '@/utils/admin-session';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { cn } from '@/utils/ui';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getNewsData(projectId: string) {
  const session = await getAdminSession();
  if (!session) return [];

  const where: any = {};
  if (projectId !== 'all') {
    where.OR = [
      { projectId },
      { projectId: null }
    ];
  }

  return await prisma.news.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AdminNewsPage() {
  const projectId = await getActiveProjectId();
  const news = await getNewsData(projectId || 'all');
  

  const projects = await prisma.project.findMany({
    select: { id: true, name: true, brandColor: true }
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
       <AdminHeader 
          title="Новости и Обновления"
          subtitle="Управление контентом, акциями и системными уведомлениями"
          projects={projects}
          projectId={projectId || 'all'}
       />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Поиск новостей..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Фильтры</span>
          </button>
          
          <Link 
            href="/admin/news/new"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Создать</span>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/30 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <ImageIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium">Новостей пока нет</h3>
            <p className="text-slate-500 mt-1">Создайте свою первую публикацию, чтобы она появилась в списке</p>
          </div>
        )}

        {news.map((item: any) => (
          <div 
            key={item.id}
            className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
          >
            {/* Image/Placeholder */}
            <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
               {item.imageUrl ? (
                 <NextImage 
                  src={item.imageUrl} 
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                 />
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                 </div>
               )}
               
               {/* Project Badge */}
               <div className="absolute top-4 left-4">
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm border",
                    item.projectId 
                      ? "bg-purple-100/80 border-purple-200 text-purple-700 dark:bg-purple-900/80 dark:border-purple-800 dark:text-purple-300"
                      : "bg-green-100/80 border-green-200 text-green-700 dark:bg-green-900/80 dark:border-green-800 dark:text-green-300"
                  )}>
                    {item.projectId ? <Briefcase className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    {item.projectId ? 'Проектная' : 'Глобальная'}
                  </div>
               </div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start gap-4 mb-3">
                <h3 className="text-lg font-bold line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <div className="relative flex-shrink-0">
                   <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-slate-400" />
                   </button>
                </div>
              </div>

              <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-6 flex-1">
                {item.content.replace(/<[^>]*>?/gm, '')}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Дата</span>
                  <span className="text-sm font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                   <Link 
                    href={`/admin/news/${item.id}`}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                   >
                    <Edit3 className="w-5 h-5" />
                   </Link>
                   <DeleteNewsButton id={item.id} title={item.title} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


