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

        // Add light class to html/body if needed
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';

        return () => {
            // Restore default on unmount if moving away from admin
            // However, since it's a layout, it stays as long as in /admin
        };
    }, []);

    return null;
}
