/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { deleteProjectAction } from './actions';
import { Button, AdminCard } from '@/components/admin/ui';
import { Plus, Bot, Globe, ShieldAlert, Trash2 } from 'lucide-react';
import { ProjectEditorModal } from '@/components/admin/projects/project-editor-modal';
import { ProjectCreateForm } from '@/components/admin/projects/project-create-form';
import { cookies } from 'next/headers';
import { CryptoService } from '@/services/core';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get('admin_session');
  const { verifyAdminSession } = await import('@/services/core/jwt');
  const session = sessionData ? await verifyAdminSession(sessionData.value) : null;

  if (!session) return null;

  // ФИЛЬТРУЕМ ПРОЕКТЫ
  const projectsWhere: any = {};
  if (!session.isGlobalAdmin) {
    projectsWhere.id = { in: session.allowedProjects };
  }

  const projects = await prisma.project.findMany({
    where: projectsWhere,
    orderBy: { createdAt: 'desc' }
  }) as any[];

  // DECRYPT TOKENS FOR DISPLAY/EDITING
  const projectsWithDecryptedTokens = projects.map(p => ({
    ...p,
    botToken: p.botToken ? CryptoService.decrypt(p.botToken) : null
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase italic font-black">Управление платформами</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {session.isGlobalAdmin
              ? 'Добавляйте новых ботов и сайты для масштабирования бизнеса.'
              : 'Управление вашими доступными платформами.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Форма добавления - ТОЛЬКО ДЛЯ ГЛОБАЛЬНЫХ АДМИНОВ */}
        {session.isGlobalAdmin && (
          <AdminCard className="p-6 border-dashed border-2 flex flex-col justify-start items-center space-y-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-semibold uppercase font-black text-sm">Новый проект</h2>
            <ProjectCreateForm />
          </AdminCard>
        )}

        {/* Список проектов */}
        {projectsWithDecryptedTokens.map((project: any) => (
          <AdminCard key={project.id} className="p-0 overflow-hidden group transition-all hover:shadow-xl hover:shadow-slate-200/50 flex flex-col h-full bg-white border border-slate-200 rounded-[2.5rem]">
            <div className="p-8 space-y-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl shadow-inner group-hover:scale-110 transition-transform" style={{ backgroundColor: `${project.brandColor}15`, color: project.brandColor }}>
                    {project.botToken ? <Bot className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-800 leading-tight tracking-tight uppercase">{project.name}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">{project.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ProjectEditorModal project={project} />
                  {session.isGlobalAdmin && project.slug !== 'default' && (
                    <form action={deleteProjectAction.bind(null, project.id)}>
                      <button className="p-2 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100/50">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pricing</span>
                  <span className="text-xs font-bold text-slate-700">{(project.pricingRules as any)?.length || 0} правил</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${project.maintenanceMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-tight ${project.maintenanceMode ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {project.maintenanceMode ? 'Maintenance' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="bg-slate-100 p-1.5 rounded-lg shrink-0">
                    <ShieldAlert size={14} className={project.botToken ? 'text-blue-500' : 'text-slate-300'} />
                  </div>
                  <span className="text-[10px] font-bold truncate">Bot: {project.botToken ? 'Подключен' : 'Не настроен'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="bg-slate-100 p-1.5 rounded-lg shrink-0">
                    <Globe size={14} className={project.domain ? 'text-indigo-500' : 'text-slate-300'} />
                  </div>
                  <span className="text-[10px] font-bold truncate">Web: {project.domain || 'Нет домена'}</span>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <Link href={`/admin/projects/${project.id}`} className="w-full">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl py-6 group/btn" variant="secondary">
                    Настроить платформу
                    <Plus className="ml-2 w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </div >
  );
}


