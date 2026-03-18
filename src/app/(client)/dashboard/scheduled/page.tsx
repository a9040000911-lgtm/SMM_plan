/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { getClientProjectId } from '@/utils/project-resolver';
import { ScheduledOrdersUI } from "@/components/stitch/dashboard/ScheduledOrdersUI";
import { OrderLifecycleService } from "@/services/orders/order-lifecycle.service";
import { UserService } from "@/services/users/user.service";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Запланированные заказы | Smmplan' };

export default async function ScheduledOrdersPage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    
    const projectId = await getClientProjectId();
    const user = await UserService.getUserByEmail(session.user.email, projectId);
    if (!user) redirect('/login');

    const result = await OrderLifecycleService.getScheduledOrders(user.id);

    if (!result.success) {
        return <div>Ошибка при загрузке запланированных заказов</div>;
    }

    const serializedOrders = JSON.parse(JSON.stringify(result.data));

    return (
        <div className="container mx-auto px-4 py-8">
            <ScheduledOrdersUI initialOrders={serializedOrders} />
        </div>
    );
}


