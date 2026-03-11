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
import { prisma } from '@/lib/prisma';
import { Locale, dictionaries } from '@/i18n/dictionaries';
import { getActiveProjectId } from '@/utils/project-resolver';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const session = await getAdminSession();

  const pathname = headerList.get('x-pathname') || '';
  const isLoginPage = pathname === '/admin/login';

  if (!session && !isLoginPage) {
    redirect('/admin/login');
  }

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-950">
        {children}
      </div>
    );
  }

  const cookieStore = await cookies();
  const langCookie = (cookieStore.get('smmplan_lang')?.value as Locale) || 'ru';
  const dict = dictionaries[langCookie] || dictionaries.ru;
  // eslint-disable-next-line unused-imports/no-unused-vars
  const t = dict.admin?.sidebar;

  let sidebarUser = {
    id: session?.id || '0',
    username: session?.username || 'Admin',
    role: session?.role || 'ADMIN',
    earlyBirdRank: null as number | null,
    tgId: session?.tgId || '0',
    allowedTabs: session?.permissions || []
  };
  let isGlobalAdmin = session?.isGlobalAdmin ?? true;

  const activeProjectId = await getActiveProjectId();
  const accessibleProjects = await prisma.project.findMany({
    where: isGlobalAdmin ? {} : { id: { in: session?.allowedProjects || [] } },
    select: { id: true, name: true, brandColor: true }
  });

  try {
    if (session?.tgId) {
      const dbUser = await prisma.user.findUnique({
        where: { tgId: BigInt(session.tgId) }
      });
      if (dbUser && (dbUser.role !== 'USER' || session.role !== 'USER')) {
        sidebarUser = {
          id: dbUser.id,
          username: dbUser.username || sidebarUser.username,
          role: dbUser.role,
          earlyBirdRank: dbUser.earlyBirdRank,
          tgId: dbUser.tgId?.toString() || sidebarUser.tgId,
          allowedTabs: dbUser.allowedTabs.length > 0 ? dbUser.allowedTabs : sidebarUser.allowedTabs
        };
        isGlobalAdmin = session.isGlobalAdmin || dbUser.isGlobalAdmin;
      }
    }
  } catch (e) {
    console.error('Error fetching sidebar user details:', e);
  }

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
