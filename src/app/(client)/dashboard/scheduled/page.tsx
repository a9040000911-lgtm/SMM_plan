/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { ScheduledOrdersUI } from "@/components/stitch/dashboard/ScheduledOrdersUI";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Запланированные заказы | Smmplan' };

async function getUser() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    const projectId = await getClientProjectId();
    const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
    if (!user) redirect('/login');
    return user;
}

export default async function ScheduledOrdersPage() {
    const user = await getUser();

    const scheduledOrders = await prisma.scheduledOrder.findMany({
        where: { userId: user.id },
        orderBy: { scheduleTime: 'asc' },
        include: {
            service: {
                select: {
                    name: true,
                    platform: true,
                }
            }
        }
    });

    const serializedOrders = JSON.parse(JSON.stringify(scheduledOrders));

    return (
        <div className="container mx-auto px-4 py-8">
            <ScheduledOrdersUI initialOrders={serializedOrders} />
        </div>
    );
}
