/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { getClientProjectId } from '@/utils/project-resolver';
import { ReferralsUI } from "@/components/stitch/dashboard/ReferralsUI";
import { ReferralService } from "@/services/users/referral.service";
import { UserService } from "@/services/users/user.service";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Партнерский Клуб — Зарабатывайте с Smmplan | Smmplan' };

export default async function ReferralsDashboardPage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    
    const projectId = await getClientProjectId();
    const user = await UserService.getUserByEmail(session.user.email, projectId);
    
    if (!user) redirect('/login');

    const result = await ReferralService.getReferralDashboardData(user.id, projectId || 'all');

    if (!result.success) {
        console.error(`[ReferralsDashboardPage] Failed to fetch referral data: ${result.error.message}`);
        return <div>Ошибка при загрузке партнерских данных</div>;
    }

    return (
        <ReferralsUI
            initialLeaderboard={result.data.leaderboard as any}
            initialUserStats={result.data.userStats as any}
        />
    );
}


