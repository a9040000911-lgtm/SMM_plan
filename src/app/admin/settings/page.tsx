/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { cookies } from 'next/headers';
import { Locale, dictionaries } from '@/i18n/dictionaries';
import { AdminTabs } from '@/components/admin/core/admin-tabs';
import { Settings, Layers, Globe, Shield } from 'lucide-react';
import { GlobalConfiguration } from './global-configuration';
import { PlatformsManager } from './platforms-manager';
import { GlobalSettingsForm } from './global-settings-form';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const requestedProjectId = typeof searchParams.projectId === 'string' ? searchParams.projectId : undefined;

  const session = await getAdminSession();
  if (!session) return null;

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.getSettingsDashboardData(ctx, requestedProjectId);

  const cookieStore = await cookies();
  const lang = cookieStore.get('smmplan_lang')?.value as Locale || 'ru';
  const t = dictionaries[lang].admin.settings;

  if (!result.success) {
    return <div className="p-8 text-red-500">Ошибка: {result.error.message}</div>;
  }

  const { project, settingsMap, allProjects, platforms, globalSettingsMap } = result.data;

  // Decrypt sensitive global settings for display
  const { CryptoService } = await import('@/services/core/crypto.service');
  Object.keys(globalSettingsMap).forEach(key => {
    if (globalSettingsMap[key] && globalSettingsMap[key].includes(':')) {
      globalSettingsMap[key] = CryptoService.decrypt(globalSettingsMap[key]);
    }
  });

  const isGlobalAdmin = session.isGlobalAdmin;

  const tabs = [
    { label: t.tabs.config, icon: <Settings size={16} />, id: 'config' },
    { label: 'Платформы', icon: <Globe size={16} />, id: 'platforms', description: 'Управление соцсетями и их определением' },
    isGlobalAdmin && { label: 'Платформа', icon: <Shield size={16} />, id: 'global-settings', description: 'Глобальные лимиты и безопасность' },
  ].filter(Boolean) as any[];

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-900 text-white rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Глобальные Настройки</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Управление платформой</p>
          </div>
        </div>
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
      </AdminTabs>
    </div>
  );
}


