'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { softDeleteUserAction } from '@/app/admin/users/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteUserButtonProps {
    userId: string;
}

export function DeleteUserButton({ userId }: DeleteUserButtonProps) {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Вы уверены, что хотите удалить (архивировать) этого пользователя? TG ID и Email будут отвязаны, баланс обнулен.')) return;

        setIsPending(true);
        try {
            await softDeleteUserAction(userId);
            toast.success('Пользователь успешно удален');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка удаления пользователя');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className={`p-1 text-rose-500 hover:bg-rose-50 rounded ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Удалить пользователя"
        >
            <Trash2 size={13} />
        </button>
    );
}


