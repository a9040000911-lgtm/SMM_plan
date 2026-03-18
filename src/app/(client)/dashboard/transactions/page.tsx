/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { getClientProjectId } from '@/utils/project-resolver';
import { TransactionsUI } from "@/components/stitch/dashboard/TransactionsUI";
import { LedgerService } from "@/services/finance/ledger.service";
import { UserService } from "@/services/users/user.service";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Транзакции и Финансы — Управление балансом | Smmplan' };

export default async function TransactionsPage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    
    const projectId = await getClientProjectId();
    const user = await UserService.getUserByEmail(session.user.email, projectId);
    if (!user) redirect('/login');

    const result = await LedgerService.getUserPayments(user.id);
    const balanceResult = await LedgerService.getUserBalance(user.id);

    if (!result.success || !balanceResult.success) {
        return <div>Ошибка при загрузке финансовых данных</div>;
    }

    const serializedTransactions = JSON.parse(JSON.stringify(result.data));

    return (
        <TransactionsUI
            initialBalance={balanceResult.data}
            initialTransactions={serializedTransactions}
        />
    );
}


