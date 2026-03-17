"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import { TmaInterface } from "@/components/client/TmaInterface";
import { Loader2 } from "lucide-react";

export function TmaRedirect({ children }: { children: React.ReactNode }) {
    const [isTma, setIsTma] = useState<boolean | null>(null);

    useEffect(() => {
        // Safe check for Telegram WebApp
        const checkTma = () => {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.initData) {
                setIsTma(true);
            } else {
                setIsTma(false);
            }
        };

        // Attempt initial check
        checkTma();

        // If still null (loading state), set a hard timeout of 3s 
        // to prevent indefinite spinner if script is blocked (ERR_CONNECTION_RESET)
        const timeout = setTimeout(() => {
            if (isTma === null) {
                console.warn("TMA Initialization timeout. Falling back to Web view.");
                setIsTma(false);
            }
        }, 3000);

        return () => clearTimeout(timeout);
    }, [isTma]);

    if (isTma === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (isTma) {
        return <TmaInterface />;
    }

    return <>{children}</>;
}
