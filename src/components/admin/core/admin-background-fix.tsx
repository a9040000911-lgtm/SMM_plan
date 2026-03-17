'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useEffect } from 'react';

export function AdminBackgroundFix() {
    useEffect(() => {
        // Set body background to light gray
        document.body.style.backgroundColor = '#f8fafc';
        
        // Force light class and remove dark
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
        document.body.classList.remove('dark');

        return () => {
            // Restore default on unmount if moving away from admin
        };
    }, []);

    return null;
}
