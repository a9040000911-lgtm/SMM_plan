/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { SupportUI } from "@/components/stitch/dashboard/SupportUI";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Служба поддержки — Мы всегда на связи | Smmplan' };

async function getUser() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    const projectId = await getClientProjectId();
    const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
    if (!user) redirect('/login');
    return user;
}

export default async function SupportPage() {
    const user = await getUser();

    const tickets = await prisma.supportTicket.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    return (
        <SupportUI initialTickets={tickets as any} />
    );
}
