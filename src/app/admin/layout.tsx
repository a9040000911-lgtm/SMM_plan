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
import { AdminBackgroundFix } from '@/components/admin/core/admin-background-fix';
import { Locale, dictionaries } from '@/i18n/dictionaries';
import { getActiveProjectId } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

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
    return <div className="min-h-screen bg-slate-950">{children}</div>;
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
      return <div>Error loading layout: {layoutResult.error.message}</div>;
  }

  const { accessibleProjects, sidebarUser, isGlobalAdmin } = layoutResult.data;

  const langCookie = (cookieStore.get('smmplan_lang')?.value as Locale) || 'ru';
  const dict = dictionaries[langCookie] || dictionaries.ru;

  return (
    <div className="light min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 font-sans">
      <AdminBackgroundFix />
      <LayoutWrapper
        user={sidebarUser}
        isGlobalAdmin={isGlobalAdmin}
        dict={dict.admin?.sidebar}
        lang={langCookie}
        accessibleProjects={accessibleProjects}
        activeProjectId={activeProjectId}
      >
        <CommandPalette />
        <NavigationHotkeys />
        {children}
      </LayoutWrapper>
    </div>
  );
}
