/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { getClientProjectId } from '@/utils/project-resolver';
import { SupportUI } from "@/components/stitch/dashboard/SupportUI";
import { SupportService } from "@/services/users/support.service";
import { UserService } from "@/services/users/user.service";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Служба поддержки — Мы всегда на связи | Smmplan' };

export default async function SupportPage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    
    const projectId = await getClientProjectId();
    const user = await UserService.getUserByEmail(session.user.email, projectId);
    if (!user) redirect('/login');

    const result = await SupportService.getUserTickets(user.id);

    if (!result.success) {
        return <div>Ошибка при загрузке обращений</div>;
    }

    return (
        <SupportUI initialTickets={result.data as any} />
    );
}
