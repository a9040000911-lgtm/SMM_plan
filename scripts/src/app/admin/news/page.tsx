/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import {
  Newspaper,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { DeleteNewsButton } from '@/components/admin/news/delete-news-button';
import { dictionaries, Locale } from '@/i18n/dictionaries';

import { getAdminSession } from '@/utils/admin-session';
import { getActiveProjectId } from '@/utils/project-resolver';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { Globe, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getNewsData(projectId: string) {
  const session = await getAdminSession();
  if (!session) return { news: [], projects: [] };

  const isGlobalAdmin = session?.isGlobalAdmin || false;
  const allowedProjects = session?.allowedProjects || [];

  const projects = await prisma.project.findMany({
    where: isGlobalAdmin ? {} : { id: { in: allowedProjects } },
    select: { id: true, name: true, brandColor: true }
  });

  const news = await prisma.news.findMany({
    where: projectId === 'all' ? (isGlobalAdmin ? {} : { projectId: { in: allowedProjects } }) : { projectId },
    orderBy: { createdAt: 'desc' },
    include: { project: true }
  });

  return { news, projects };
}

export default async function NewsManagementPage() {
  const projectId = await getActiveProjectId();
  const { news: newsList, projects } = await getNewsData(projectId || 'all');
  const cookieStore = await cookies();
  const lang = cookieStore.get('smmplan_lang')?.value as Locale || 'ru';
  const t = dictionaries[lang].admin.news;

  const stats = {
    total: newsList.length,
    sent: newsList.filter(n => n.isSent).length,
    drafts: newsList.filter(n => !n.isSent).length
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <AdminHeader
        title={t.title}
        subtitle={t.subtitle}
        projects={projects}
        projectId={projectId || 'all'}
      />

      {/* CONTEXT BANNER */}
      <div className={cn(
        "p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300",
        projectId && projectId !== 'all'
          ? "bg-blue-50/50 border-blue-100 shadow-sm shadow-blue-50"
          : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-2.5 rounded-xl shadow-sm",
            projectId && projectId !== 'all' ? "bg-blue-600 text-white" : "bg-slate-800 text-white"
          )}>
            {projectId && projectId !== 'all' ? <Briefcase size={20} /> : <Globe size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-800 tracking-tight">
                {projectId && projectId !== 'all'
                  ? `Контекст проекта: ${projects.find(p => p.id === projectId)?.name}`
                  : 'Глобальный режим'}
              </h3>
              <span className={cn(
                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                projectId && projectId !== 'all'
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-slate-200 text-slate-600 border-slate-300"
              )}>
                {projectId && projectId !== 'all' ? 'PROJECT MODE' : 'GLOBAL MASTER'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {projectId && projectId !== 'all'
                ? 'Вы управляете новостями только для этого проекта.'
                : 'Внимание: В этом режиме отображаются все новости системы.'}
            </p>
          </div>
        </div>

        <Link
          href="/admin/news/new"
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-sm shrink-0"
        >
          <Plus size={18} />
          {t.create_btn}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Newspaper size={20} /></div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t.stats.total}</div>
            <div className="text-xl font-bold text-slate-800">{stats.total}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={20} /></div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t.stats.sent}</div>
            <div className="text-xl font-bold text-slate-800">{stats.sent}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={20} /></div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t.stats.drafts}</div>
            <div className="text-xl font-bold text-slate-800">{stats.drafts}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">{t.table.content}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.table.status}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.table.date}</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {newsList.map((news) => (
              <tr key={news.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {news.imageUrl ? (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden relative">
                          <NextImage src={news.imageUrl} alt="Announcement" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col max-w-md">
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-bold text-slate-800">{news.title}</span>
                        {news.project && (
                          <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {news.project.slug}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{news.content}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${news.isSent
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                    {news.isSent ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                    {news.isSent ? t.status.sent : t.status.draft}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-500">
                    {new Date(news.createdAt).toLocaleDateString()}<br />
                    {new Date(news.createdAt).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!news.isSent && (
                      <Link
                        href={`/admin/news/${news.id}/broadcast`}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title={t.table.actions.send}
                      >
                        <Send size={18} />
                      </Link>
                    )}
                    <Link
                      href={`/admin/news/${news.id}`}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title={t.table.actions.edit}
                    >
                      <Edit3 size={18} />
                    </Link>
                    <DeleteNewsButton id={news.id} title={news.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
