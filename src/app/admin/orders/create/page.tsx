/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { AdminHeader } from '@/components/admin/ui';
import { AdminManualOrderForm } from './AdminManualOrderForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getAdminSession } from '@/utils/admin-session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminCreateOrderPage() {
    const session = await getAdminSession();
    if (!session) {
        redirect('/admin/login');
    }

    return (
        <div className="p-8">
            <AdminHeader
                title="Ручное оформление заказа"
                subtitle="Создание заказа для клиента в обход автоматической валидации ссылок"
                action={
                    <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-slate-800 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Назад к списку
                    </Link>
                }
            />

            <AdminManualOrderForm />
        </div>
    );
}
