/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { getClientProjectId } from '@/utils/project-resolver';
import { OrdersUI } from "@/components/stitch/dashboard/OrdersUI";
import { OrderLifecycleService } from "@/services/orders/order-lifecycle.service";
import { UserService } from "@/services/users/user.service";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Мои заказы — История активности | Smmplan' };

export default async function OrdersPage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    
    const projectId = await getClientProjectId();
    const user = await UserService.getUserByEmail(session.user.email, projectId);
    if (!user) redirect('/login');

    const result = await OrderLifecycleService.getUserOrders(user.id);

    if (!result.success) {
        console.error(`[OrdersPage] Failed to fetch orders: ${result.error.message}`);
        return <div>Ошибка при загрузке заказов</div>;
    }

    const serializedOrders = JSON.parse(JSON.stringify(result.data));

    return (
        <OrdersUI initialOrders={serializedOrders} />
    );
}


