/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { ReferralsUI } from "@/components/stitch/dashboard/ReferralsUI";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Партнерский Клуб — Зарабатывайте с Smmplan | Smmplan' };

async function getReferralData() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    const projectId = await getClientProjectId();
    const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
    if (!user) redirect('/login');

    // Fetch leaderboard by referralEarnings
    const leaderboard = await prisma.user.findMany({
        where: { projectId },
        take: 10,
        orderBy: { referralEarnings: 'desc' },
        select: {
            id: true,
            email: true,
            username: true,
            referralEarnings: true,
            _count: {
                select: { referrals: true }
            }
        }
    });

    const transformedLeaderboard = leaderboard.map((u, i) => ({
        rank: i + 1,
        userId: u.id,
        username: u.username || (u.email ? u.email.split('@')[0] : 'Partner'),
        referralCount: u._count.referrals,
        revenue: u.referralEarnings.toString(),
    }));

    // User personal stats
    const referralsCount = await prisma.user.count({
        where: { referrerId: user.id }
    });

    return {
        leaderboard: transformedLeaderboard,
        userStats: {
            totalReferrals: referralsCount,
            totalEarnings: user.referralEarnings.toString(),
            currentMonthCount: 0,
            currentMonthRevenue: "0",
            currentRank: null,
            tierBreakdown: { tier1: referralsCount, tier2: 0, tier3: 0 },
            referralCode: user.id.split('-')[0]
        }
    };
}

export default async function ReferralsDashboardPage() {
    const data = await getReferralData();

    return (
        <ReferralsUI
            initialLeaderboard={data.leaderboard as any}
            initialUserStats={data.userStats as any}
        />
    );
}
