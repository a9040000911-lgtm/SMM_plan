'use client';

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 * 
 * SandboxBanner — Persistent warning banner when Sandbox Mode is active.
 * Displayed at the top of admin layout to prevent operational errors.
 */
import { useState, useEffect } from 'react';

export function SandboxBanner() {
    const [sandbox, setSandbox] = useState<{
        enabled: boolean;
        expiresAt: string | null;
    } | null>(null);

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('/api/admin/sandbox');
                if (res.ok) {
                    setSandbox(await res.json());
                }
            } catch { /* ignore */ }
        };
        check();
        // Re-check every 30 seconds
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!sandbox?.enabled) return null;

    const expiresAt = sandbox.expiresAt ? new Date(sandbox.expiresAt) : null;
    const timeLeft = expiresAt ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 60000)) : null;

    return (
        <div
            id="sandbox-banner"
            className="sticky top-0 z-[100] flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold"
            style={{
                background: 'repeating-linear-gradient(-45deg, #f59e0b, #f59e0b 10px, #fbbf24 10px, #fbbf24 20px)',
                color: '#78350f',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
            }}
        >
            <span className="text-lg">🧪</span>
            <span>РЕЖИМ ПЕСОЧНИЦЫ АКТИВЕН</span>
            <span className="opacity-70">|</span>
            <span className="font-normal">
                Провайдеры: мок-сервер • Платежи: TEST
                {timeLeft !== null && ` • Авто-отключение через ${timeLeft} мин`}
            </span>
        </div>
    );
}
