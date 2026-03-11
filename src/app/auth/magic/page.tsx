'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function MagicLoginHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }

        const doLogin = async () => {
            try {
                const res = await signIn('credentials', {
                    magicToken: token,
                    redirect: false,
                });

                if (res?.error) {
                    router.push(`/login?error=${encodeURIComponent(res.error)}`);
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Magic Login Error:', error);
                router.push('/login?error=NetworkError');
            }
        };

        doLogin();
    }, [token, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 opacity-50" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                Авторизуем вас в системе...
            </p>
        </div>
    );
}

export default function MagicLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
            </div>
        }>
            <MagicLoginHandler />
        </Suspense>
    );
}
