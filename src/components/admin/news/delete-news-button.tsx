'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteNewsAction } from '@/app/admin/news/actions';
import { useRouter } from 'next/navigation';

export function DeleteNewsButton({ id, title }: { id: string; title: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(`Вы действительно хотите удалить новость "${title}"?`)) return;

        setIsDeleting(true);
        const res = await deleteNewsAction(id);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error);
        }
        setIsDeleting(false);
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
            title="Удалить"
        >
            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
        </button>
    );
}


