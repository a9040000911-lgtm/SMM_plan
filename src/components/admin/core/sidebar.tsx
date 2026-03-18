/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { cookies } from 'next/headers';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  Package,
  Newspaper,
  Database,
  MessageSquare,
  Briefcase,
  TrendingUp,
  Award,
  ShieldAlert,
  Tag,
  History,
  BookOpen,
  Bug,
  CreditCard,
  Wallet,
  Scale
} from 'lucide-react';
import { LogoutButton } from '@/components/admin/core/logout-button';
import { prisma } from '@/lib/prisma';
import { AdminUser } from '@/types/admin';
import { Locale, dictionaries } from '@/i18n/dictionaries';
import { SidebarNav } from './sidebar-nav';

export async function Sidebar() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');
  const langCookie = cookieStore.get('smmplan_lang')?.value as Locale || 'ru';
  const t = dictionaries[langCookie].admin.sidebar;

  const navGroups = [
    {
      title: t.nav_sections.management,
      items: [
        { id: 'dashboard', name: t.dashboard, href: '/admin', icon: LayoutDashboard },
        { id: 'orders', name: t.orders, href: '/admin/orders', icon: ShoppingCart },
        { id: 'scheduled', name: t.scheduled, href: '/admin/scheduled', icon: History },
        { id: 'users', name: t.users, href: '/admin/users', icon: Users },
        { id: 'employees', name: t.employees, href: '/admin/employees', icon: Briefcase },
      ]
    },
    {
      title: t.nav_sections.showcase,
      items: [
        { id: 'services', name: t.services, href: '/admin/services', icon: Package },
        { id: 'providers', name: t.providers, href: '/admin/providers', icon: Database },
      ]
    },
    {
      title: t.nav_sections.marketing,
      items: [
        { id: 'marketing', name: 'Сайт и Контент', href: '/admin/content', icon: Newspaper },
        { id: 'promocodes', name: t.promocodes, href: '/admin/promo-codes', icon: Tag },
        { id: 'reviews', name: 'Отзывы', href: '/admin/marketing/reviews', icon: MessageSquare },
        { id: 'advocacy', name: t.advocacy, href: '/admin/advocacy/nps', icon: Award },
      ]
    },
    {
      title: t.nav_sections.finance,
      items: [
        { id: 'finance', name: t.finance, href: '/admin/finance', icon: TrendingUp },
        { id: 'transactions', name: t.transactions, href: '/admin/transactions', icon: CreditCard },
        { id: 'expenses', name: t.expenses, href: '/admin/expenses', icon: Wallet },
      ]
    },
    {
      title: t.nav_sections.support,
      items: [
        { id: 'support', name: t.support, href: '/admin/support', icon: MessageSquare },
        { id: 'kb', name: t.knowledge_base, href: '/admin/knowledge-base', icon: BookOpen },
        { id: 'bugs', name: t.bug_reports, href: '/admin/bug-reports', icon: Bug },
      ]
    },
    {
      title: t.nav_sections.system,
      items: [
        { id: 'projects', name: t.projects, href: '/admin/projects', icon: Settings },
        { id: 'legal', name: 'Документы', href: '/admin/legal', icon: Scale },
        { id: 'logs', name: t.logs, href: '/admin/logs', icon: History },
        { id: 'security', name: t.security, href: '/admin/security', icon: ShieldAlert },
        { id: 'settings', name: t.settings, href: '/admin/settings', icon: Settings },
      ]
    }
  ];

  let user: AdminUser = { id: '0', username: 'Админ', role: 'ADMIN', earlyBirdRank: null, tgId: BigInt(0), allowedTabs: [] };
  let isGlobalAdmin = true;

  if (sessionCookie?.value) {
    try {
      const { verifyAdminSession } = await import('@/services/core/jwt');
      const sessionUser = await verifyAdminSession(sessionCookie.value);

      if (sessionUser) {
        const tgId = sessionUser.tgId ? BigInt(sessionUser.tgId) : BigInt(0);

        if (tgId > BigInt(0)) {
          const dbUser = await prisma.user.findUnique({
            where: { tgId: tgId }
          });

          if (dbUser) {
            user = {
              id: dbUser.id,
              username: dbUser.username || 'User',
              role: dbUser.role,
              earlyBirdRank: dbUser.earlyBirdRank,
              tgId: dbUser.tgId || BigInt(0),
              allowedTabs: dbUser.allowedTabs
            };
            isGlobalAdmin = dbUser.isGlobalAdmin;
          }
        }
      }
    } catch (err) {
      console.error('Failed to parse admin session cookie or fetch user:', err);
    }
  }

  const activeProjectId = cookieStore.get('active_project_id')?.value || null;
  const projects = await prisma.project.findMany({ select: { id: true, name: true } });
  const activeProject = projects.find(p => p.id === activeProjectId);

  const roleNames: Record<string, string> = {
    'ADMIN': t.roles.ADMIN,
    'SUPPORT': t.roles.SUPPORT,
    'SEO': t.roles.SEO,
    'USER': t.roles.USER
  };

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50">
      <div className="p-6 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            SMMPlan
          </h1>
          {activeProject ? (
            <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[9px] font-black uppercase tracking-tighter">
              {activeProject.name.slice(0, 10)}
            </div>
          ) : (
            <div className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[9px] font-black uppercase tracking-tighter">
              Global
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold text-[10px]">{t.title} — {t.subtitle}</p>
      </div>

      <SidebarNav
        navGroups={navGroups}
        isGlobalAdmin={isGlobalAdmin}
        allowedTabs={user.allowedTabs}
      />

      <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3 px-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {user.username?.substring(0, 2) || (langCookie === 'ru' ? 'АД' : 'AD')}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">@{user.username || 'admin'}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
              {roleNames[user.role] || user.role}
            </span>
            {user.earlyBirdRank && (
              <div className="flex items-center gap-1 mt-0.5 text-blue-400">
                <span className="text-[10px]">💎</span>
                <span className="text-[9px] font-black uppercase tracking-wide">{t.pioneer} #{user.earlyBirdRank}</span>
              </div>
            )}
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}


