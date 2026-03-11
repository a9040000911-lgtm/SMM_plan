/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { OrderDetailsUI } from "@/components/stitch/dashboard/OrderDetailsUI";

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: any) {
    const p = await params;
    return { title: `Заказ #${p.id} — Детальная информация | Smmplan` };
}

async function getOrderData(orderId: string) {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    const projectId = await getClientProjectId();
    const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
    if (!user) redirect('/login');

    const id = parseInt(orderId);
    if (isNaN(id)) notFound();

    const order = await prisma.order.findFirst({
        where: { id, userId: user.id },
        include: { internalService: { select: { name: true, platform: true, category: true, requirements: true, numericId: true } } }
    });
    if (!order) notFound();
    return order;
}

export default async function OrderDetailPage({ params }: any) {
    const p = await params;
    const order = await getOrderData(p.id);

    return (
        <OrderDetailsUI order={JSON.parse(JSON.stringify(order))} />
    );
}
