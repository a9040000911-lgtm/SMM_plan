/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { getClientProjectId } from '@/utils/project-resolver';
import { DashboardUI } from "@/components/stitch/dashboard/DashboardUI";
import { UserService } from "@/services/users/user.service";
import { AnalyticsService } from "@/services/users/analytics.service";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Дашборд — Ваш обзор деятельности | Smmplan' };

async function getUserContext() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    
    const projectId = await getClientProjectId();
    const user = await UserService.getUserByEmail(session.user.email, projectId);
    
    if (!user) redirect('/login');
    return user;
}

export default async function DashboardPage() {
    const user = await getUserContext();

    const [stats, recentOrders] = await Promise.all([
        AnalyticsService.getUserDashboardStats(user.id),
        AnalyticsService.getRecentOrders(user.id, 5)
    ]);

    // Serialize data for Client Components
    const serializedUser = JSON.parse(JSON.stringify(user));
    const serializedOrders = JSON.parse(JSON.stringify(recentOrders));

    return (
        <DashboardUI
            user={serializedUser}
            stats={stats}
            recentOrders={serializedOrders}
        />
    );
}
