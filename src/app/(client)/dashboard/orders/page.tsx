/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { OrdersUI } from "@/components/stitch/dashboard/OrdersUI";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Мои заказы — История активности | Smmplan' };

async function getUser() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    const projectId = await getClientProjectId();
    const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
    if (!user) redirect('/login');
    return user;
}

export default async function OrdersPage() {
    const user = await getUser();

    const orders = await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
            internalService: {
                select: {
                    name: true,
                    platform: true,
                }
            }
        }
    });

    const serializedOrders = JSON.parse(JSON.stringify(orders));

    return (
        <OrdersUI initialOrders={serializedOrders} />
    );
}
