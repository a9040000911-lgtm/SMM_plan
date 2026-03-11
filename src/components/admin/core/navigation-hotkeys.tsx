'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function NavigationHotkeys() {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if Alt key is pressed and NOT in an input/textarea
            if (!e.altKey || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

            const key = e.key.toLowerCase();

            // Map keys to paths
            const routes: Record<string, string> = {
                's': '/admin/services',
                'o': '/admin/orders',
                'u': '/admin/users',
                'h': '/admin/support',
                'p': '/admin/providers',
                'n': '/admin/content?tab=news',
                'd': '/admin', // Dashboard
                'ы': '/admin/services', // Cyrillic fallbacks
                'щ': '/admin/orders',
                'г': '/admin/users',
                'р': '/admin/support',
                'з': '/admin/providers',
                'т': '/admin/content?tab=news',
                'в': '/admin'
            };

            if (routes[key]) {
                e.preventDefault();
                router.push(routes[key]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return null; // This component doesn't render anything
}
