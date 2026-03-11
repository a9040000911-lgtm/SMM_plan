/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getAdminSession } from '@/utils/admin-session';
import { SupportMessenger } from '@/components/admin/support/support-messenger';
import { getUserReferralData } from '../referrals/actions';
import { ReferralNetwork } from '@/components/admin/users/referral-network';
import { UserDetailsForm } from '@/components/admin/users/user-details-form';
import { UserOrdersList } from '@/components/admin/users/user-orders-list';
import { LoyaltyService } from '@/services/users/loyalty.service';

export const dynamic = 'force-dynamic';

async function getUserData(id: string) {
  const [user, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
    }),
    prisma.order.findMany({
      where: { userId: id },
      take: 20,
      include: { internalService: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  ]);

  if (!user) return { user: null, referralData: null, orders: [] };

  const serializedUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    balance: user.balance.toString(),
    spent: user.spent.toString(),
    referralEarnings: user.referralEarnings.toString(),
    referralPercent: user.referralPercent,
    isPermanentlyBanned: user.isPermanentlyBanned,
    banExpiresAt: user.banExpiresAt,
    supportNotes: user.supportNotes,
    moderationNote: user.moderationNote,
    tgId: user.tgId?.toString(),
    createdAt: user.createdAt,
    isEarlyBird: user.isEarlyBird,
    earlyBirdRank: user.earlyBirdRank,
    effectiveReferralPercent: await LoyaltyService.getReferralPercent(user.id, user.projectId || 'DEFAULT'),
    isGlobalAdmin: user.isGlobalAdmin,
  };

  const referralData = await getUserReferralData(id);

  const serializedOrders = orders.map((o: any) => ({
    ...o,
    totalPrice: o.totalPrice.toString(),
  }));

  return { user: serializedUser, referralData, orders: serializedOrders };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getUserData(id);
  const { user, referralData, orders } = data;
  await getAdminSession();

  if (!user) notFound();

  return (
    <div className="space-y-10 max-w-6xl p-8 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tighter uppercase italic">Профиль пользователя</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Редактирование данных и параметров {user.username || user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Main Form */}
        <UserDetailsForm user={user} />

        {/* ORDER HISTORY SECTION */}
        <UserOrdersList orders={orders as any} />

        {/* REFERRAL NETWORK SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Share2 size={20} className="text-purple-500" />
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">Реферальная сеть</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Анализ приглашенных пользователей и доходности сети</p>
            </div>
          </div>
          <div className="p-8">
            <ReferralNetwork data={referralData} />
          </div>
        </div>

        {/* Support Messenger / Notes */}
        <SupportMessenger userId={user.id} initialNotes={user.supportNotes} />
      </div>
    </div>
  );
}
