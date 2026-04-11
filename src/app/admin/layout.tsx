/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { LayoutWrapper } from '@/components/admin/core/layout-wrapper';
import { CommandPalette } from '@/components/admin/core/command-palette';
import { NavigationHotkeys } from '@/components/admin/core/navigation-hotkeys';
import { headers, cookies } from 'next/headers';
import { getAdminSession } from '@/utils/admin-session';
import { redirect } from 'next/navigation';

import { Locale, dictionaries } from '@/i18n/dictionaries';
import { getActiveProjectId } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';
import { AdminProvider } from '@/components/admin/core/admin-context';
import { SandboxBanner } from '@/components/admin/core/sandbox-banner';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headerList = await headers();
  const session = await getAdminSession();

  const pathname = headerList.get('x-pathname') || '';
  const isLoginPage = pathname === '/admin/login';

  if (!session && !isLoginPage) {
    redirect('/admin/login');
  }

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const ctx: AdminContext = {
    userId: session!.id,
    role: session!.role as any,
    allowedProjects: session!.allowedProjects,
    isGlobalAdmin: session!.isGlobalAdmin
  };

  // Use AdminDataService for layout data to avoid direct prisma
  const [activeProjectId, layoutResult] = await Promise.all([
    getActiveProjectId(),
    AdminDataService.getLayoutData(ctx, session?.tgId || undefined)
  ]);

  if (!layoutResult.success) {
      return (
          <div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6 gap-4 bg-slate-50">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500 text-2xl">⚠️</div>
              <h2 className="text-xl font-black text-slate-800">Ошибка загрузки панели</h2>
              <p className="text-slate-500 text-sm max-w-sm">
                  Не удалось загрузить административный интерфейс.<br />
                  Попробуйте обновить страницу или обратитесь к системному администратору.
              </p>
              <code className="text-xs text-rose-400 bg-rose-50 px-3 py-1 rounded-lg font-mono">
                  {layoutResult.error.message}
              </code>
              <a href="/admin" className="mt-2 px-6 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition-colors">
                  Попробовать снова
              </a>
          </div>
      );
  }

  const { accessibleProjects, sidebarUser, isGlobalAdmin } = layoutResult.data;

  const langCookie = (cookieStore.get('smmplan_lang')?.value as Locale) || 'ru';
  const dict = dictionaries[langCookie] || dictionaries.ru;

  const isStudio = pathname.startsWith('/admin/cms/studio') || pathname.startsWith('/admin/cms/editor-projects');

  if (isStudio) {
      return (
          <div className="min-h-screen bg-[#05070a] text-slate-200 selection:bg-blue-500/30 font-sans">
              <AdminProvider
                  initialProjectId={activeProjectId}
                  initialProjects={accessibleProjects as any}
              >
                  {children}
              </AdminProvider>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 font-sans">
      <LayoutWrapper
        user={sidebarUser}
        isGlobalAdmin={isGlobalAdmin}
        dict={dict.admin?.sidebar}
        lang={langCookie}
        accessibleProjects={accessibleProjects}
        activeProjectId={activeProjectId}
        initialIsCollapsed={cookieStore.get('sidebar-collapsed')?.value === 'true'}
      >
        <SandboxBanner />
        <CommandPalette />
        <NavigationHotkeys />
        {children}
      </LayoutWrapper>
    </div>
  );
}


