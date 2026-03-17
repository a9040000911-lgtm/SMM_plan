/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { getClientProjectId } from '@/utils/project-resolver';
import { SettingsUI } from "@/components/stitch/dashboard/SettingsUI";
import { UserService } from "@/services/users/user.service";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Настройки — Безопасность и Личные данные | Smmplan' };

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    
    const projectId = await getClientProjectId();
    const userResult = await UserService.getUserByEmail(session.user.email, projectId);
    if (!userResult) redirect('/login');

    const result = await UserService.getUserSettings(userResult.id, projectId || 'all');

    if (!result.success) {
        console.error(`[SettingsPage] Failed to fetch settings: ${result.error.message}`);
        return <div>Ошибка при загрузке настроек</div>;
    }

    return (
        <SettingsUI userData={JSON.parse(JSON.stringify(result.data))} />
    );
}
