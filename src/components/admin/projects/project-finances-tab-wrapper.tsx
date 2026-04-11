import React from 'react';
import { prisma } from '@/lib/prisma';
import { ProjectFinancesTab } from './project-finances-tab';

interface ProjectFinancesTabWrapperProps {
    projectId: string;
}

export async function ProjectFinancesTabWrapper({ projectId }: ProjectFinancesTabWrapperProps) {
    // Fetch Financial Data for this project directly inside the tab
    const [transactionsRaw, expensesRaw] = await Promise.all([
        prisma.transaction.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: 20
        }),
        prisma.businessExpense.findMany({
            where: { projectId },
            orderBy: { date: 'desc' },
            take: 20
        })
    ]);

    const transactions = transactionsRaw.map(tx => ({
        ...tx,
        amount: tx.amount.toNumber(),
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString()
    }));

    const expenses = expensesRaw.map(ex => ({
        ...ex,
        amount: ex.amount.toNumber(),
        date: ex.date.toISOString(),
        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString()
    }));

    const totalIncome = transactions
        .filter(tx => tx.type === 'DEPOSIT' || tx.type === 'REFUND')
        .reduce((acc, tx) => acc + (tx.type === 'REFUND' ? -tx.amount : tx.amount), 0);

    const totalExpenses = expenses.reduce((acc, ex) => acc + ex.amount, 0);

    const financeStats = {
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses
    };

    return (
        <ProjectFinancesTab
            stats={financeStats}
            recentTransactions={transactions as any}
            recentExpenses={expenses as any}
        />
    );
}
