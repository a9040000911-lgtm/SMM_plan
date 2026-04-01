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
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[40vh] text-center px-6 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 text-2xl">⚠️</div>
                <h2 className="text-xl font-black text-slate-800">Ошибка загрузки данных</h2>
                <p className="text-slate-500 text-sm max-w-sm">Не удалось загрузить финансовые данные. Пожалуйста, обновите страницу или попробуйте позже.</p>
                <a href="/dashboard/transactions" className="mt-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                    Обновить страницу
                </a>
            </div>
        );
    }

    const serializedTransactions = JSON.parse(JSON.stringify(result.data));

    return (
        <TransactionsUI
            initialBalance={balanceResult.data}
            initialTransactions={serializedTransactions}
        />
    );
}


