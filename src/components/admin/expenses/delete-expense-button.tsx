'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { deleteExpenseAction } from '@/app/admin/expenses/actions';

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (!confirm('Вы уверены?')) return;
        setIsDeleting(true);
        try {
            await deleteExpenseAction(expenseId);
        } catch (error) {
            alert('Ошибка удаления');
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button 
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
        >
            <Trash2 size={16} />
        </button>
    );
}
