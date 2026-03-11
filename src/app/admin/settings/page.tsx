/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { Locale, dictionaries } from '@/i18n/dictionaries';
import { AdminTabs } from '@/components/admin/core/admin-tabs';
import { Settings, Layers, History, Globe, Shield } from 'lucide-react';
import { GlobalConfiguration } from './global-configuration';
import ProjectsPage from '../projects/page';
import AdminLogsPage from '../logs/page';
import { ProjectSelector } from './components';
import { PlatformsManager } from './platforms-manager';
import { GlobalSettingsForm } from './global-settings-form';
import { getAdminSession } from '@/utils/admin-session';

export const dynamic = 'force-dynamic';

async function getProjectData(projectId?: string) {
  let project;
  if (projectId) {
    project = await prisma.project.findUnique({ where: { id: projectId } });
  }

  if (!project) {
    // Default to first available or '101' if global query failed
    project = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
  }

  // Get project-specific settings + Global overrides (?)
  // For now, settings are stored with projectId.
  const globalSettings = await prisma.settings.findMany({
    where: project ? { projectId: project.id } : { projectId: null }
  });

  const settingsMap: Record<string, string> = {};
  globalSettings.forEach(s => settingsMap[s.key] = s.value);

  // Get list of projects for selector
  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true, slug: true }
  });

  return { project, settingsMap, allProjects };
}

export default async function SettingsPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const requestedProjectId = searchParams.projectId;
  const { project: rawProject, settingsMap, allProjects: rawAllProjects } = await getProjectData(requestedProjectId);

  const project = rawProject ? {
    ...rawProject,
    createdAt: rawProject.createdAt.toISOString(),
    updatedAt: rawProject.updatedAt.toISOString(),
  } : null;

  const allProjects = rawAllProjects.map(p => ({
    ...p
  }));

  const cookieStore = await cookies();
  const lang = cookieStore.get('smmplan_lang')?.value as Locale || 'ru';
  const t = dictionaries[lang].admin.settings;

  if (!project) return <div>{t.project_not_found}</div>;

  // FETCH PLATFORMS
  const platforms = await prisma.socialPlatform.findMany({
    orderBy: { isActive: 'desc' } // Active first
  });

  // FETCH GLOBAL SETTINGS
  const globalSettingsList = await prisma.globalSetting.findMany();
  const globalSettingsMap: Record<string, string> = {};
  globalSettingsList.forEach(s => globalSettingsMap[s.key] = s.value);

  const session = await getAdminSession();
  const isGlobalAdmin = session?.isGlobalAdmin || false;

  const tabs = [
    { label: t.tabs.config, icon: <Settings size={16} />, id: 'config' },
    { label: 'Платформы', icon: <Globe size={16} />, id: 'platforms', description: 'Управление соцсетями и их определением' },
    isGlobalAdmin && { label: 'Платформа', icon: <Shield size={16} />, id: 'global-settings', description: 'Глобальные лимиты и безопасность' },
    { label: t.tabs.projects, icon: <Layers size={16} />, id: 'projects' },
    { label: t.tabs.logs, icon: <History size={16} />, id: 'logs' },
  ].filter(Boolean) as any[];

  return (
    <div className="space-y-8 pb-12">
      {/* Project Selector Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-900 text-white rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{t.title}</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.subtitle}</p>
          </div>
        </div>
        <ProjectSelector allProjects={allProjects} currentProjectId={project.id} />
      </div>
      <AdminTabs tabs={tabs}>
        <div>
          <GlobalConfiguration project={project} settingsMap={settingsMap} />
        </div>

        <div>
          <PlatformsManager platforms={platforms} />
        </div>

        {isGlobalAdmin && (
          <div>
            <GlobalSettingsForm initialSettings={globalSettingsMap} />
          </div>
        )}

        <div>
          <ProjectsPage />
        </div>

        <div>
          <AdminLogsPage />
        </div>
      </AdminTabs>
    </div>
  );
}
