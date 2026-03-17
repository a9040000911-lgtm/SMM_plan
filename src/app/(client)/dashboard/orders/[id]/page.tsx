/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { redirect, notFound } from 'next/navigation';
import { getClientProjectId } from '@/utils/project-resolver';
import { OrderDetailsUI } from "@/components/stitch/dashboard/OrderDetailsUI";
import { OrderLifecycleService } from "@/services/orders/order-lifecycle.service";
import { UserService } from "@/services/users/user.service";

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: any) {
    const p = await params;
    return { title: `Заказ #${p.id} — Детальная информация | Smmplan` };
}

export default async function OrderDetailPage({ params }: any) {
    const p = await params;
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    
    const projectId = await getClientProjectId();
    const user = await UserService.getUserByEmail(session.user.email, projectId);
    if (!user) redirect('/login');

    const orderId = parseInt(p.id);
    if (isNaN(orderId)) notFound();

    const result = await OrderLifecycleService.getOrderById(orderId, user.id);

    if (!result.success) {
        notFound();
    }

    return (
        <OrderDetailsUI order={JSON.parse(JSON.stringify(result.data))} />
    );
}
