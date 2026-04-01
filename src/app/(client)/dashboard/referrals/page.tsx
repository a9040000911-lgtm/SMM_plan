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
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[40vh] text-center px-6 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 text-2xl">⚠️</div>
                <h2 className="text-xl font-black text-slate-800">Ошибка загрузки данных</h2>
                <p className="text-slate-500 text-sm max-w-sm">Не удалось загрузить партнёрские данные. Пожалуйста, обновите страницу.</p>
                <a href="/dashboard/referrals" className="mt-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                    Обновить страницу
                </a>
            </div>
        );
    }

    return (
        <ReferralsUI
            initialLeaderboard={result.data.leaderboard as any}
            initialUserStats={result.data.userStats as any}
        />
    );
}


