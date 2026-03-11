/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { CreateUserForm } from '@/components/admin/users/create-user-form';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
    return (
        <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/users" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <UserPlus className="text-blue-500" />
                        Создание пользователя
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">Добавление нового аккаунта в систему вручную.</p>
                </div>
            </div>

            <CreateUserForm />
        </div>
    );
}
