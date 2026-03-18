'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteEmployeeAction } from '@/app/admin/employees/actions';

interface StaffDeleteButtonProps {
    userId: string;
    username: string;
}

export function StaffDeleteButton({ userId, username }: StaffDeleteButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Вы уверены, что хотите удалить сотрудника @${username}?`)) return;

        setIsDeleting(true);
        try {
            await deleteEmployeeAction(userId);
        } catch (err: any) {
            alert(err.message || 'Ошибка удаления');
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 disabled:opacity-50"
            title="Удалить сотрудника (мягкое удаление)"
        >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
    );
}


