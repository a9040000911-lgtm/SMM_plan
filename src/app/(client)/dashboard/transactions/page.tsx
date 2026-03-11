/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { TransactionsUI } from "@/components/stitch/dashboard/TransactionsUI";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Транзакции и Финансы — Управление балансом | Smmplan' };

async function getUser() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    const projectId = await getClientProjectId();
    const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
    if (!user) redirect('/login');
    return user;
}

export default async function TransactionsPage() {
    const user = await getUser();

    const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });

    const serializedTransactions = JSON.parse(JSON.stringify(transactions));

    return (
        <TransactionsUI
            initialBalance={user.balance.toNumber()}
            initialTransactions={serializedTransactions}
        />
    );
}
